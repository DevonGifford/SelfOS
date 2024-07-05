package training

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"

	"github.com/DevonGifford/SelfOS/apps/api/internal/database"
)

// testHandler opens a connection, begins a transaction, and rolls it back
// at the end of the test — same isolation every other domain here uses.
// Clears every training table inside the transaction first, so tests get
// a deterministic empty view; the delete rolls back with everything else.
func testHandler(t *testing.T) *Handler {
	t.Helper()

	for _, path := range []string{".env", "../.env", "../../.env", "../../../.env", "../../../../.env"} {
		if err := godotenv.Load(path); err == nil {
			break
		}
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		t.Skip("DATABASE_URL not set, skipping DB-backed test")
	}

	conn, err := pgx.Connect(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}

	tx, err := conn.Begin(context.Background())
	if err != nil {
		t.Fatalf("begin tx: %v", err)
	}

	t.Cleanup(func() {
		_ = tx.Rollback(context.Background())
		_ = conn.Close(context.Background())
	})

	const clear = `
		delete from workout_sets;
		delete from workout_session_exercises;
		delete from workout_sessions;
		delete from workout_template_sets;
		delete from workout_templates;
		delete from exercises;
	`
	if _, err := tx.Exec(context.Background(), clear); err != nil {
		t.Fatalf("clear training tables: %v", err)
	}

	return NewHandler(database.New(tx))
}

func noAuth(next http.Handler) http.Handler { return next }

func doRequest(h *Handler, method, path string, body any) *httptest.ResponseRecorder {
	mux := http.NewServeMux()
	h.Register(mux, noAuth)

	var reader *bytes.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		reader = bytes.NewReader(b)
	} else {
		reader = bytes.NewReader(nil)
	}

	req := httptest.NewRequest(method, path, reader)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	return rec
}

func decodeErrors(t *testing.T, rec *httptest.ResponseRecorder) map[string]string {
	t.Helper()
	var body struct {
		Errors map[string]string `json:"errors"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode errors: %v", err)
	}
	return body.Errors
}

func createExercise(t *testing.T, h *Handler, name, exerciseType, workoutType string) ExerciseResponse {
	t.Helper()
	rec := doRequest(h, http.MethodPost, "/api/training/exercises", CreateExerciseRequest{
		Name: name, Type: exerciseType, WorkoutType: workoutType,
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("create exercise %q: expected 201, got %d: %s", name, rec.Code, rec.Body.String())
	}
	var resp ExerciseResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode create exercise response: %v", err)
	}
	return resp
}

func createTemplate(t *testing.T, h *Handler, name, workoutType string) WorkoutTemplateResponse {
	t.Helper()
	rec := doRequest(h, http.MethodPost, "/api/training/templates", CreateWorkoutTemplateRequest{
		Name: name, WorkoutType: workoutType,
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("create template %q: expected 201, got %d: %s", name, rec.Code, rec.Body.String())
	}
	var resp WorkoutTemplateResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode create template response: %v", err)
	}
	return resp
}

func createSession(t *testing.T, h *Handler, workoutType string, templateID *string) WorkoutSessionResponse {
	t.Helper()
	rec := doRequest(h, http.MethodPost, "/api/training/sessions", CreateWorkoutSessionRequest{
		WorkoutType: workoutType, TemplateID: templateID,
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("create session: expected 201, got %d: %s", rec.Code, rec.Body.String())
	}
	var resp WorkoutSessionResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode create session response: %v", err)
	}
	return resp
}

func TestCreateExercise(t *testing.T) {
	h := testHandler(t)

	resp := createExercise(t, h, "Bench Press", "strength", "push")
	if resp.Name != "Bench Press" || resp.Type != "strength" || resp.WorkoutType != "push" {
		t.Fatalf("unexpected response: %+v", resp)
	}
}

func TestCreateExerciseRejectsFreestyle(t *testing.T) {
	h := testHandler(t)

	rec := doRequest(h, http.MethodPost, "/api/training/exercises", CreateExerciseRequest{
		Name: "Bench Press", Type: "strength", WorkoutType: "freestyle",
	})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
	if _, ok := decodeErrors(t, rec)["workoutType"]; !ok {
		t.Fatalf("expected error on workoutType, got %v", decodeErrors(t, rec))
	}
}

func TestListExercises(t *testing.T) {
	h := testHandler(t)
	createExercise(t, h, "Bench Press", "strength", "push")
	createExercise(t, h, "Treadmill", "cardio", "cardio")

	rec := doRequest(h, http.MethodGet, "/api/training/exercises", nil)
	var resp []ExerciseResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp) != 2 {
		t.Fatalf("expected 2 exercises, got %d", len(resp))
	}
}

func TestCreateWorkoutTemplateDuplicateNameConflict(t *testing.T) {
	h := testHandler(t)
	createTemplate(t, h, "Push Day", "push")

	rec := doRequest(h, http.MethodPost, "/api/training/templates", CreateWorkoutTemplateRequest{
		Name: "Push Day", WorkoutType: "push",
	})
	if rec.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestWorkoutTemplateSameNameDifferentTypeAllowed(t *testing.T) {
	h := testHandler(t)
	createTemplate(t, h, "Heavy", "push")

	rec := doRequest(h, http.MethodPost, "/api/training/templates", CreateWorkoutTemplateRequest{
		Name: "Heavy", WorkoutType: "pull",
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201 (same name, different Workout Type), got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestSetDefaultTemplateClearsPreviousDefault(t *testing.T) {
	h := testHandler(t)
	first := createTemplate(t, h, "Push Day", "push")
	doRequest(h, http.MethodPost, "/api/training/templates/"+first.ID+"/set-default", nil)

	second := createTemplate(t, h, "Push Heavy", "push")
	rec := doRequest(h, http.MethodPost, "/api/training/templates/"+second.ID+"/set-default", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	rec = doRequest(h, http.MethodGet, "/api/training/templates", nil)
	var templates []WorkoutTemplateResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &templates); err != nil {
		t.Fatalf("decode: %v", err)
	}
	defaults := 0
	for _, tpl := range templates {
		if tpl.IsDefault {
			defaults++
			if tpl.ID != second.ID {
				t.Fatalf("expected %q to be the only default, but %q is default", second.Name, tpl.Name)
			}
		}
	}
	if defaults != 1 {
		t.Fatalf("expected exactly 1 default template, got %d", defaults)
	}
}

func TestArchiveDefaultTemplateBlocked(t *testing.T) {
	h := testHandler(t)
	tpl := createTemplate(t, h, "Push Day", "push")
	doRequest(h, http.MethodPost, "/api/training/templates/"+tpl.ID+"/set-default", nil)

	rec := doRequest(h, http.MethodPost, "/api/training/templates/"+tpl.ID+"/archive", nil)
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422 archiving the default template, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestArchiveAndRestoreTemplate(t *testing.T) {
	h := testHandler(t)
	tpl := createTemplate(t, h, "Push Light", "push")

	rec := doRequest(h, http.MethodPost, "/api/training/templates/"+tpl.ID+"/archive", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("archive: expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var archived WorkoutTemplateResponse
	json.Unmarshal(rec.Body.Bytes(), &archived)
	if !archived.Archived {
		t.Fatalf("expected archived=true, got %+v", archived)
	}

	rec = doRequest(h, http.MethodPost, "/api/training/templates/"+tpl.ID+"/restore", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("restore: expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var restored WorkoutTemplateResponse
	json.Unmarshal(rec.Body.Bytes(), &restored)
	if restored.Archived {
		t.Fatalf("expected archived=false after restore, got %+v", restored)
	}
}

func TestCreateFreestyleSessionRejectsTemplate(t *testing.T) {
	h := testHandler(t)
	tpl := createTemplate(t, h, "Push Day", "push")

	rec := doRequest(h, http.MethodPost, "/api/training/sessions", CreateWorkoutSessionRequest{
		WorkoutType: "freestyle", TemplateID: &tpl.ID,
	})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestCreateSessionFromTemplateSeedsExercisesAndSets(t *testing.T) {
	h := testHandler(t)
	bench := createExercise(t, h, "Bench Press", "strength", "push")
	ohp := createExercise(t, h, "Overhead Press", "strength", "push")
	tpl := createTemplate(t, h, "Push Day", "push")

	// Seed the template directly via the internal helper the handlers
	// share — same path saveAsTemplate/updateSourceTemplate use.
	templateID, _ := parseUUID(tpl.ID)
	benchID, _ := parseUUID(bench.ID)
	ohpID, _ := parseUUID(ohp.ID)
	snapshot := []exerciseSnapshot{
		{exerciseID: benchID, exerciseName: bench.Name, sets: []database.WorkoutSet{
			{SetType: "working"}, {SetType: "working"},
		}},
		{exerciseID: ohpID, exerciseName: ohp.Name, sets: []database.WorkoutSet{
			{SetType: "working"},
		}},
	}
	if err := h.writeTemplateSets(context.Background(), templateID, snapshot); err != nil {
		t.Fatalf("seed template sets: %v", err)
	}

	session := createSession(t, h, "push", &tpl.ID)

	rec := doRequest(h, http.MethodGet, "/api/training/sessions/"+session.ID+"/exercises", nil)
	var sessionExercises []WorkoutSessionExerciseResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &sessionExercises); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(sessionExercises) != 2 {
		t.Fatalf("expected 2 session-exercises (Bench, OHP), got %d: %+v", len(sessionExercises), sessionExercises)
	}

	rec = doRequest(h, http.MethodGet, "/api/training/session-exercises/"+sessionExercises[0].ID+"/sets", nil)
	var sets []WorkoutSetResponse
	json.Unmarshal(rec.Body.Bytes(), &sets)
	if len(sets) != 2 {
		t.Fatalf("expected 2 seeded sets for the first exercise, got %d", len(sets))
	}
	if sets[0].Confirmed {
		t.Fatalf("expected seeded sets to start unconfirmed (pending-rows-you-confirm), got confirmed=true")
	}
}

func TestAddReorderAndRemoveSessionExercise(t *testing.T) {
	h := testHandler(t)
	bench := createExercise(t, h, "Bench Press", "strength", "push")
	ohp := createExercise(t, h, "Overhead Press", "strength", "push")
	session := createSession(t, h, "push", nil)

	rec := doRequest(h, http.MethodPost, "/api/training/sessions/"+session.ID+"/exercises", CreateSessionExerciseRequest{ExerciseID: bench.ID})
	var first WorkoutSessionExerciseResponse
	json.Unmarshal(rec.Body.Bytes(), &first)

	rec = doRequest(h, http.MethodPost, "/api/training/sessions/"+session.ID+"/exercises", CreateSessionExerciseRequest{ExerciseID: ohp.ID})
	var second WorkoutSessionExerciseResponse
	json.Unmarshal(rec.Body.Bytes(), &second)

	if first.Position != 0 || second.Position != 1 {
		t.Fatalf("expected append-ordered positions 0,1, got %d,%d", first.Position, second.Position)
	}

	rec = doRequest(h, http.MethodPost, "/api/training/sessions/"+session.ID+"/exercises/reorder",
		ReorderSessionExercisesRequest{IDs: []string{second.ID, first.ID}})
	if rec.Code != http.StatusNoContent {
		t.Fatalf("reorder: expected 204, got %d: %s", rec.Code, rec.Body.String())
	}

	rec = doRequest(h, http.MethodGet, "/api/training/sessions/"+session.ID+"/exercises", nil)
	var reordered []WorkoutSessionExerciseResponse
	json.Unmarshal(rec.Body.Bytes(), &reordered)
	if reordered[0].ID != second.ID {
		t.Fatalf("expected %q first after reorder, got %+v", ohp.Name, reordered)
	}

	rec = doRequest(h, http.MethodDelete, "/api/training/session-exercises/"+first.ID, nil)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("remove: expected 204, got %d: %s", rec.Code, rec.Body.String())
	}
	rec = doRequest(h, http.MethodGet, "/api/training/sessions/"+session.ID+"/exercises", nil)
	var remaining []WorkoutSessionExerciseResponse
	json.Unmarshal(rec.Body.Bytes(), &remaining)
	if len(remaining) != 1 {
		t.Fatalf("expected 1 exercise remaining after removal, got %d", len(remaining))
	}
}

func TestReplaceSessionExerciseDropsItsSets(t *testing.T) {
	h := testHandler(t)
	bench := createExercise(t, h, "Bench Press", "strength", "push")
	dips := createExercise(t, h, "Dips", "strength", "push")
	session := createSession(t, h, "push", nil)

	rec := doRequest(h, http.MethodPost, "/api/training/sessions/"+session.ID+"/exercises", CreateSessionExerciseRequest{ExerciseID: bench.ID})
	var sessionExercise WorkoutSessionExerciseResponse
	json.Unmarshal(rec.Body.Bytes(), &sessionExercise)

	weight := 80.0
	reps := int32(8)
	doRequest(h, http.MethodPost, "/api/training/sets", CreateWorkoutSetRequest{
		SessionExerciseID: sessionExercise.ID, SetType: "working", WeightKg: &weight, Reps: &reps,
	})

	rec = doRequest(h, http.MethodPost, "/api/training/session-exercises/"+sessionExercise.ID+"/replace",
		ReplaceSessionExerciseRequest{ExerciseID: dips.ID})
	if rec.Code != http.StatusOK {
		t.Fatalf("replace: expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var replaced WorkoutSessionExerciseResponse
	json.Unmarshal(rec.Body.Bytes(), &replaced)
	if replaced.ExerciseName != "Dips" {
		t.Fatalf("expected exercise replaced with Dips, got %+v", replaced)
	}

	rec = doRequest(h, http.MethodGet, "/api/training/session-exercises/"+sessionExercise.ID+"/sets", nil)
	var sets []WorkoutSetResponse
	json.Unmarshal(rec.Body.Bytes(), &sets)
	if len(sets) != 0 {
		t.Fatalf("expected sets dropped after replace, got %d", len(sets))
	}
}

func TestCreateUpdateConfirmAndDeleteSet(t *testing.T) {
	h := testHandler(t)
	bench := createExercise(t, h, "Bench Press", "strength", "push")
	session := createSession(t, h, "push", nil)
	rec := doRequest(h, http.MethodPost, "/api/training/sessions/"+session.ID+"/exercises", CreateSessionExerciseRequest{ExerciseID: bench.ID})
	var sessionExercise WorkoutSessionExerciseResponse
	json.Unmarshal(rec.Body.Bytes(), &sessionExercise)

	weight := 60.0
	reps := int32(10)
	rec = doRequest(h, http.MethodPost, "/api/training/sets", CreateWorkoutSetRequest{
		SessionExerciseID: sessionExercise.ID, SetType: "working", WeightKg: &weight, Reps: &reps,
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("create set: expected 201, got %d: %s", rec.Code, rec.Body.String())
	}
	var set WorkoutSetResponse
	json.Unmarshal(rec.Body.Bytes(), &set)
	if set.Confirmed {
		t.Fatalf("expected a freshly-added set to start unconfirmed")
	}

	confirmed := true
	rec = doRequest(h, http.MethodPatch, "/api/training/sets/"+set.ID, UpdateWorkoutSetRequest{Confirmed: &confirmed})
	if rec.Code != http.StatusOK {
		t.Fatalf("confirm: expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var updated WorkoutSetResponse
	json.Unmarshal(rec.Body.Bytes(), &updated)
	if !updated.Confirmed || *updated.WeightKg != 60 {
		t.Fatalf("expected confirmed=true, weightKg preserved at 60, got %+v", updated)
	}

	rec = doRequest(h, http.MethodDelete, "/api/training/sets/"+set.ID, nil)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("delete: expected 204, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestFinishAndCancelSession(t *testing.T) {
	h := testHandler(t)
	session := createSession(t, h, "push", nil)

	rec := doRequest(h, http.MethodPost, "/api/training/sessions/"+session.ID+"/finish", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("finish: expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var finished WorkoutSessionResponse
	json.Unmarshal(rec.Body.Bytes(), &finished)
	if finished.FinishedAt == nil {
		t.Fatalf("expected finishedAt to be set")
	}

	other := createSession(t, h, "pull", nil)
	rec = doRequest(h, http.MethodDelete, "/api/training/sessions/"+other.ID, nil)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("cancel: expected 204, got %d: %s", rec.Code, rec.Body.String())
	}
	rec = doRequest(h, http.MethodGet, "/api/training/sessions/"+other.ID, nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected cancelled session to be gone, got %d", rec.Code)
	}
}

func TestUnfinishedSessionResume(t *testing.T) {
	h := testHandler(t)

	rec := doRequest(h, http.MethodGet, "/api/training/sessions/unfinished", nil)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204 with no unfinished session, got %d: %s", rec.Code, rec.Body.String())
	}

	session := createSession(t, h, "push", nil)
	rec = doRequest(h, http.MethodGet, "/api/training/sessions/unfinished", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var resumed WorkoutSessionResponse
	json.Unmarshal(rec.Body.Bytes(), &resumed)
	if resumed.ID != session.ID {
		t.Fatalf("expected to resume %q, got %+v", session.ID, resumed)
	}

	doRequest(h, http.MethodPost, "/api/training/sessions/"+session.ID+"/finish", nil)
	rec = doRequest(h, http.MethodGet, "/api/training/sessions/unfinished", nil)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204 once the session is finished, got %d", rec.Code)
	}
}

func TestUpdateSessionNoteAndTimes(t *testing.T) {
	h := testHandler(t)
	session := createSession(t, h, "push", nil)

	note := "Shoulder felt off today"
	startedAt := "2026-01-01T09:00:00Z"
	rec := doRequest(h, http.MethodPatch, "/api/training/sessions/"+session.ID, UpdateWorkoutSessionRequest{
		Note: &note, StartedAt: &startedAt,
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var updated WorkoutSessionResponse
	json.Unmarshal(rec.Body.Bytes(), &updated)
	if updated.Note == nil || *updated.Note != note {
		t.Fatalf("expected note updated, got %+v", updated)
	}
}

// A real unique_violation aborts the rest of the shared test transaction
// at the Postgres level (SQLSTATE 25P02 on anything after it) — same
// reason internal/habits' own TestCreateEntryDuplicateRejected never
// issues another query after triggering its 409. Split across two tests,
// each with a fresh transaction, rather than one shared one.

func TestSaveAsTemplateRejectsDuplicateName(t *testing.T) {
	h := testHandler(t)
	createTemplate(t, h, "Push Heavy", "push") // pre-existing, to collide with
	session := createSession(t, h, "push", nil)

	rec := doRequest(h, http.MethodPost, "/api/training/sessions/"+session.ID+"/save-as-template",
		SaveAsTemplateRequest{WorkoutType: "push", Name: "Push Heavy"})
	if rec.Code != http.StatusConflict {
		t.Fatalf("expected 409 on duplicate name, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestSaveAsTemplateSnapshotsSession(t *testing.T) {
	h := testHandler(t)
	bench := createExercise(t, h, "Bench Press", "strength", "push")
	session := createSession(t, h, "push", nil)

	rec := doRequest(h, http.MethodPost, "/api/training/sessions/"+session.ID+"/exercises", CreateSessionExerciseRequest{ExerciseID: bench.ID})
	var sessionExercise WorkoutSessionExerciseResponse
	json.Unmarshal(rec.Body.Bytes(), &sessionExercise)
	weight := 70.0
	reps := int32(8)
	doRequest(h, http.MethodPost, "/api/training/sets", CreateWorkoutSetRequest{
		SessionExerciseID: sessionExercise.ID, SetType: "working", WeightKg: &weight, Reps: &reps,
	})

	rec = doRequest(h, http.MethodPost, "/api/training/sessions/"+session.ID+"/save-as-template",
		SaveAsTemplateRequest{WorkoutType: "push", Name: "Push Medium"})
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
	}
	var newTemplate WorkoutTemplateResponse
	json.Unmarshal(rec.Body.Bytes(), &newTemplate)

	rec = doRequest(h, http.MethodGet, "/api/training/templates/"+newTemplate.ID+"/sets", nil)
	var sets []WorkoutTemplateSetResponse
	json.Unmarshal(rec.Body.Bytes(), &sets)
	if len(sets) != 1 || sets[0].ExerciseName != "Bench Press" || *sets[0].WeightKg != 70 {
		t.Fatalf("expected the session's set snapshotted into the new template, got %+v", sets)
	}
}

func TestUpdateSourceTemplateRequiresOne(t *testing.T) {
	h := testHandler(t)
	session := createSession(t, h, "push", nil) // Freestyle-style, no source template

	rec := doRequest(h, http.MethodPost, "/api/training/sessions/"+session.ID+"/update-source-template", nil)
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422 with no source template, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestLastSetsForExerciseScopedByWorkoutType(t *testing.T) {
	h := testHandler(t)
	bench := createExercise(t, h, "Bench Press", "strength", "push")

	rec := doRequest(h, http.MethodGet, "/api/training/exercises/"+bench.ID+"/last?workoutType=push", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 even with no history, got %d: %s", rec.Code, rec.Body.String())
	}
	var empty []WorkoutSetResponse
	json.Unmarshal(rec.Body.Bytes(), &empty)
	if len(empty) != 0 {
		t.Fatalf("expected no prior sets, got %d", len(empty))
	}

	pushSession := createSession(t, h, "push", nil)
	rec = doRequest(h, http.MethodPost, "/api/training/sessions/"+pushSession.ID+"/exercises", CreateSessionExerciseRequest{ExerciseID: bench.ID})
	var sessionExercise WorkoutSessionExerciseResponse
	json.Unmarshal(rec.Body.Bytes(), &sessionExercise)
	weight := 80.0
	reps := int32(8)
	doRequest(h, http.MethodPost, "/api/training/sets", CreateWorkoutSetRequest{
		SessionExerciseID: sessionExercise.ID, SetType: "working", WeightKg: &weight, Reps: &reps,
	})

	rec = doRequest(h, http.MethodGet, "/api/training/exercises/"+bench.ID+"/last?workoutType=push", nil)
	var pushSets []WorkoutSetResponse
	json.Unmarshal(rec.Body.Bytes(), &pushSets)
	if len(pushSets) != 1 || *pushSets[0].WeightKg != 80 {
		t.Fatalf("expected last Push session's set (80kg), got %+v", pushSets)
	}

	// A Freestyle session logging the same exercise must never surface as
	// "the last Push session" — the isolation property the map decided on.
	freestyleSession := createSession(t, h, "freestyle", nil)
	rec = doRequest(h, http.MethodPost, "/api/training/sessions/"+freestyleSession.ID+"/exercises", CreateSessionExerciseRequest{ExerciseID: bench.ID})
	json.Unmarshal(rec.Body.Bytes(), &sessionExercise)
	freestyleWeight := 40.0
	doRequest(h, http.MethodPost, "/api/training/sets", CreateWorkoutSetRequest{
		SessionExerciseID: sessionExercise.ID, SetType: "working", WeightKg: &freestyleWeight, Reps: &reps,
	})

	rec = doRequest(h, http.MethodGet, "/api/training/exercises/"+bench.ID+"/last?workoutType=push", nil)
	json.Unmarshal(rec.Body.Bytes(), &pushSets)
	if len(pushSets) != 1 || *pushSets[0].WeightKg != 80 {
		t.Fatalf("expected the Freestyle set NOT to pollute Push's last-session lookup, got %+v", pushSets)
	}
}
