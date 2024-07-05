package training

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/DevonGifford/SelfOS/apps/api/internal/database"
)

// Handler serves every /api/training/* route.
type Handler struct {
	queries *database.Queries
}

func NewHandler(q *database.Queries) *Handler {
	return &Handler{queries: q}
}

// Register wires every route onto mux (Go 1.22+ pattern routing), each
// behind protect. Literal segments ("unfinished", "archive", "reorder", …)
// take precedence over the {id} wildcard at the same position, same as
// every other domain here.
func (h *Handler) Register(mux *http.ServeMux, protect func(http.Handler) http.Handler) {
	mux.Handle("GET /api/training/exercises", protect(http.HandlerFunc(h.listExercises)))
	mux.Handle("POST /api/training/exercises", protect(http.HandlerFunc(h.createExercise)))
	mux.Handle("GET /api/training/exercises/{id}/last", protect(http.HandlerFunc(h.lastSetsForExercise)))

	mux.Handle("GET /api/training/templates", protect(http.HandlerFunc(h.listTemplates)))
	mux.Handle("POST /api/training/templates", protect(http.HandlerFunc(h.createTemplate)))
	mux.Handle("GET /api/training/templates/{id}/sets", protect(http.HandlerFunc(h.listTemplateSets)))
	mux.Handle("POST /api/training/templates/{id}/archive", protect(http.HandlerFunc(h.archiveTemplate)))
	mux.Handle("POST /api/training/templates/{id}/restore", protect(http.HandlerFunc(h.restoreTemplate)))
	mux.Handle("POST /api/training/templates/{id}/set-default", protect(http.HandlerFunc(h.setDefaultTemplate)))

	mux.Handle("GET /api/training/sessions", protect(http.HandlerFunc(h.listSessions)))
	mux.Handle("POST /api/training/sessions", protect(http.HandlerFunc(h.createSession)))
	mux.Handle("GET /api/training/sessions/unfinished", protect(http.HandlerFunc(h.unfinishedSession)))
	mux.Handle("GET /api/training/sessions/{id}", protect(http.HandlerFunc(h.getSession)))
	mux.Handle("PATCH /api/training/sessions/{id}", protect(http.HandlerFunc(h.updateSession)))
	mux.Handle("DELETE /api/training/sessions/{id}", protect(http.HandlerFunc(h.cancelSession)))
	mux.Handle("POST /api/training/sessions/{id}/finish", protect(http.HandlerFunc(h.finishSession)))
	mux.Handle("POST /api/training/sessions/{id}/update-source-template", protect(http.HandlerFunc(h.updateSourceTemplate)))
	mux.Handle("POST /api/training/sessions/{id}/save-as-template", protect(http.HandlerFunc(h.saveAsTemplate)))
	mux.Handle("GET /api/training/sessions/{id}/exercises", protect(http.HandlerFunc(h.listSessionExercises)))
	mux.Handle("POST /api/training/sessions/{id}/exercises", protect(http.HandlerFunc(h.addSessionExercise)))
	mux.Handle("POST /api/training/sessions/{id}/exercises/reorder", protect(http.HandlerFunc(h.reorderSessionExercises)))

	mux.Handle("PATCH /api/training/session-exercises/{id}", protect(http.HandlerFunc(h.updateSessionExercise)))
	mux.Handle("POST /api/training/session-exercises/{id}/replace", protect(http.HandlerFunc(h.replaceSessionExercise)))
	mux.Handle("DELETE /api/training/session-exercises/{id}", protect(http.HandlerFunc(h.removeSessionExercise)))
	mux.Handle("GET /api/training/session-exercises/{id}/sets", protect(http.HandlerFunc(h.listSetsForSessionExercise)))

	mux.Handle("POST /api/training/sets", protect(http.HandlerFunc(h.createSet)))
	mux.Handle("PATCH /api/training/sets/{id}", protect(http.HandlerFunc(h.updateSet)))
	mux.Handle("DELETE /api/training/sets/{id}", protect(http.HandlerFunc(h.deleteSet)))
}

// ---- exercises ----

func (h *Handler) listExercises(w http.ResponseWriter, r *http.Request) {
	rows, err := h.queries.ListExercises(r.Context())
	if err != nil {
		writeInternalError(w, err)
		return
	}
	writeList(w, rows, toExerciseResponse)
}

func (h *Handler) createExercise(w http.ResponseWriter, r *http.Request) {
	var req CreateExerciseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if errs := validateCreateExercise(req); len(errs) > 0 {
		writeErrors(w, http.StatusUnprocessableEntity, errs)
		return
	}

	row, err := h.queries.CreateExercise(r.Context(), database.CreateExerciseParams{
		Name:        req.Name,
		Type:        req.Type,
		WorkoutType: req.WorkoutType,
	})
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeOne(w, http.StatusCreated, row, toExerciseResponse)
}

// lastSetsForExercise answers the progressive-overload prefill: the most
// recent Set(s) logged for this Exercise, from the last Session of the
// given Workout Type (map.md's decision — a direct lookup, no trend
// computation, and what keeps Freestyle from polluting Push/Pull/Legs
// progression, since Freestyle is never "the last Pull session"). No prior
// history is a normal state (a brand-new exercise), not an error — 200
// with an empty array, not 404.
func (h *Handler) lastSetsForExercise(w http.ResponseWriter, r *http.Request) {
	exerciseID, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	workoutType := r.URL.Query().Get("workoutType")
	if errs := validateSessionWorkoutType(workoutType); len(errs) > 0 {
		writeErrors(w, http.StatusBadRequest, errs)
		return
	}

	sessionExercise, err := h.queries.GetLastSessionExerciseForType(r.Context(), database.GetLastSessionExerciseForTypeParams{
		ExerciseID:  exerciseID,
		WorkoutType: workoutType,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSON(w, http.StatusOK, []WorkoutSetResponse{})
			return
		}
		writeInternalError(w, err)
		return
	}

	sets, err := h.queries.ListWorkoutSetsBySessionExercise(r.Context(), sessionExercise.ID)
	if err != nil {
		writeInternalError(w, err)
		return
	}
	writeList(w, sets, toWorkoutSetResponse)
}

// ---- templates ----

func (h *Handler) listTemplates(w http.ResponseWriter, r *http.Request) {
	rows, err := h.queries.ListWorkoutTemplates(r.Context())
	if err != nil {
		writeInternalError(w, err)
		return
	}
	writeList(w, rows, toWorkoutTemplateResponse)
}

func (h *Handler) createTemplate(w http.ResponseWriter, r *http.Request) {
	var req CreateWorkoutTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if errs := validateCreateWorkoutTemplate(req); len(errs) > 0 {
		writeErrors(w, http.StatusUnprocessableEntity, errs)
		return
	}

	row, err := h.queries.CreateWorkoutTemplate(r.Context(), database.CreateWorkoutTemplateParams{
		Name:        req.Name,
		WorkoutType: req.WorkoutType,
	})
	if err != nil {
		if isUniqueViolation(err) {
			writeErrors(w, http.StatusConflict, map[string]string{
				"name": "a template with this name already exists for this Workout Type",
			})
			return
		}
		writeInternalError(w, err)
		return
	}

	writeOne(w, http.StatusCreated, row, toWorkoutTemplateResponse)
}

func (h *Handler) listTemplateSets(w http.ResponseWriter, r *http.Request) {
	templateID, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	rows, err := h.queries.ListWorkoutTemplateSets(r.Context(), templateID)
	if err != nil {
		writeInternalError(w, err)
		return
	}
	writeList(w, rows, toWorkoutTemplateSetResponse)
}

// archiveTemplate hides a Template from the start-workout picker without
// touching any history logged from it. The current default of a Workout
// Type can't be archived until another becomes default first (map.md's
// Template lifecycle decision) — mirrors the min/max-active-count check
// internal/habits already uses for its own business-rule guard.
func (h *Handler) archiveTemplate(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	current, err := h.queries.GetWorkoutTemplate(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusNotFound, map[string]string{"id": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	if current.IsDefault {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{
			"isDefault": "pick a new default for this Workout Type before archiving it",
		})
		return
	}

	row, err := h.queries.ArchiveWorkoutTemplate(r.Context(), id)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeOne(w, http.StatusOK, row, toWorkoutTemplateResponse)
}

func (h *Handler) restoreTemplate(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	row, err := h.queries.RestoreWorkoutTemplate(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusNotFound, map[string]string{"id": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	writeOne(w, http.StatusOK, row, toWorkoutTemplateResponse)
}

// setDefaultTemplate clears the previous default for this Workout Type,
// then promotes the given Template — sequential writes, not a DB
// transaction, matching how the rest of this codebase handles business
// rules at the application layer (single-user app, no concurrent-write
// risk in practice).
func (h *Handler) setDefaultTemplate(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	target, err := h.queries.GetWorkoutTemplate(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusNotFound, map[string]string{"id": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	if err := h.queries.ClearDefaultWorkoutTemplate(r.Context(), target.WorkoutType); err != nil {
		writeInternalError(w, err)
		return
	}

	row, err := h.queries.SetDefaultWorkoutTemplate(r.Context(), id)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeOne(w, http.StatusOK, row, toWorkoutTemplateResponse)
}

// ---- sessions ----

func (h *Handler) listSessions(w http.ResponseWriter, r *http.Request) {
	rows, err := h.queries.ListWorkoutSessions(r.Context())
	if err != nil {
		writeInternalError(w, err)
		return
	}
	writeList(w, rows, toWorkoutSessionResponse)
}

// unfinishedSession answers "is there a session to resume" (ticket 03) —
// 200 with the session if one exists, 204 if not. Not finding one is the
// normal case, not an error.
func (h *Handler) unfinishedSession(w http.ResponseWriter, r *http.Request) {
	row, err := h.queries.GetUnfinishedWorkoutSession(r.Context())
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		writeInternalError(w, err)
		return
	}
	writeOne(w, http.StatusOK, row, toWorkoutSessionResponse)
}

// createSession starts a Session — persisted immediately (ADR 0003), not
// batched to Finish. If templateId is given, the Template's suggested sets
// are copied into fresh session-exercises/sets, unconfirmed, exactly as
// the logging UI expects to find them (pending-rows-you-confirm).
func (h *Handler) createSession(w http.ResponseWriter, r *http.Request) {
	var req CreateWorkoutSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if errs := validateCreateWorkoutSession(req); len(errs) > 0 {
		writeErrors(w, http.StatusUnprocessableEntity, errs)
		return
	}

	templateID, err := parseOptionalUUID(req.TemplateID)
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"templateId": "invalid id"})
		return
	}

	if templateID.Valid && req.WorkoutType == "freestyle" {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{
			"templateId": "a Freestyle session can't start from a template",
		})
		return
	}

	session, err := h.queries.CreateWorkoutSession(r.Context(), database.CreateWorkoutSessionParams{
		WorkoutType: req.WorkoutType,
		TemplateID:  templateID,
		Date:        pgtype.Date{Time: startOfToday(), Valid: true},
	})
	if err != nil {
		writeInternalError(w, err)
		return
	}

	if templateID.Valid {
		if err := h.seedSessionFromTemplate(r.Context(), session.ID, templateID); err != nil {
			writeInternalError(w, err)
			return
		}
	}

	writeOne(w, http.StatusCreated, session, toWorkoutSessionResponse)
}

func (h *Handler) getSession(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	row, err := h.queries.GetWorkoutSession(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusNotFound, map[string]string{"id": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	writeOne(w, http.StatusOK, row, toWorkoutSessionResponse)
}

// updateSession is the "Adjust start/end time" + "Add note" affordance
// (ticket 03) — note and the session's own start/finish timestamps are
// all user-correctable, e.g. fixing a bogus duration after a crash.
func (h *Handler) updateSession(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	var req UpdateWorkoutSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	params := database.UpdateWorkoutSessionParams{ID: id}
	if req.Note != nil {
		params.Note = toTextPtr(req.Note)
	}
	if req.StartedAt != nil {
		t, err := parseTimestamptz(*req.StartedAt)
		if err != nil {
			writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"startedAt": "invalid timestamp"})
			return
		}
		params.CreatedAt = t
	}
	if req.FinishedAt != nil {
		t, err := parseTimestamptz(*req.FinishedAt)
		if err != nil {
			writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"finishedAt": "invalid timestamp"})
			return
		}
		params.FinishedAt = t
	}

	row, err := h.queries.UpdateWorkoutSession(r.Context(), params)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusNotFound, map[string]string{"id": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	writeOne(w, http.StatusOK, row, toWorkoutSessionResponse)
}

func (h *Handler) finishSession(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	row, err := h.queries.FinishWorkoutSession(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusNotFound, map[string]string{"id": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	writeOne(w, http.StatusOK, row, toWorkoutSessionResponse)
}

// cancelSession is "Cancel Workout" — a hard delete of the whole session,
// cascading to its exercises and sets. Confirmed as a needed capability on
// ticket 03, given Sessions persist from Start.
func (h *Handler) cancelSession(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	if err := h.queries.DeleteWorkoutSession(r.Context(), id); err != nil {
		writeInternalError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// updateSourceTemplate is one of Save as Template's three paths (map.md):
// overwrite the Session's source Template with this Session's current
// exercises/sets. Does nothing to the Session or its history — only the
// Template's own rows change.
func (h *Handler) updateSourceTemplate(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	session, err := h.queries.GetWorkoutSession(r.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusNotFound, map[string]string{"id": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	if !session.TemplateID.Valid {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{
			"templateId": "this session didn't start from a template",
		})
		return
	}

	snapshot, err := h.snapshotSession(r.Context(), id)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	if err := h.queries.DeleteWorkoutTemplateSetsByTemplate(r.Context(), session.TemplateID); err != nil {
		writeInternalError(w, err)
		return
	}
	if err := h.writeTemplateSets(r.Context(), session.TemplateID, snapshot); err != nil {
		writeInternalError(w, err)
		return
	}

	template, err := h.queries.GetWorkoutTemplate(r.Context(), session.TemplateID)
	if err != nil {
		writeInternalError(w, err)
		return
	}
	writeOne(w, http.StatusOK, template, toWorkoutTemplateResponse)
}

// saveAsTemplate is Save as Template's other path: snapshot this Session's
// current exercises/sets into a brand-new Template, leaving any source
// Template untouched. A duplicate name within the same Workout Type is
// rejected with a conflict, not silently overwritten or versioned.
func (h *Handler) saveAsTemplate(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	var req SaveAsTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if errs := validateSaveAsTemplate(req); len(errs) > 0 {
		writeErrors(w, http.StatusUnprocessableEntity, errs)
		return
	}

	if _, err := h.queries.GetWorkoutSession(r.Context(), id); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusNotFound, map[string]string{"id": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	snapshot, err := h.snapshotSession(r.Context(), id)
	if err != nil {
		writeInternalError(w, err)
		return
	}

	template, err := h.queries.CreateWorkoutTemplate(r.Context(), database.CreateWorkoutTemplateParams{
		Name:        req.Name,
		WorkoutType: req.WorkoutType,
	})
	if err != nil {
		if isUniqueViolation(err) {
			writeErrors(w, http.StatusConflict, map[string]string{
				"name": "a template with this name already exists for this Workout Type",
			})
			return
		}
		writeInternalError(w, err)
		return
	}

	if err := h.writeTemplateSets(r.Context(), template.ID, snapshot); err != nil {
		writeInternalError(w, err)
		return
	}

	writeOne(w, http.StatusCreated, template, toWorkoutTemplateResponse)
}

// ---- session exercises ----

func (h *Handler) listSessionExercises(w http.ResponseWriter, r *http.Request) {
	sessionID, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	rows, err := h.queries.ListWorkoutSessionExercises(r.Context(), sessionID)
	if err != nil {
		writeInternalError(w, err)
		return
	}
	writeList(w, rows, toWorkoutSessionExerciseResponse)
}

func (h *Handler) addSessionExercise(w http.ResponseWriter, r *http.Request) {
	sessionID, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	var req CreateSessionExerciseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	exerciseID, err := parseUUID(req.ExerciseID)
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"exerciseId": "invalid id"})
		return
	}

	exercise, err := h.queries.GetExercise(r.Context(), exerciseID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"exerciseId": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	row, err := h.queries.CreateWorkoutSessionExercise(r.Context(), database.CreateWorkoutSessionExerciseParams{
		SessionID:    sessionID,
		ExerciseID:   exerciseID,
		ExerciseName: exercise.Name,
	})
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeOne(w, http.StatusCreated, row, toWorkoutSessionExerciseResponse)
}

// reorderSessionExercises is "Move up"/"Move down" — the client sends the
// exercise list's full new order (mirrors habits.ReorderHabits exactly).
func (h *Handler) reorderSessionExercises(w http.ResponseWriter, r *http.Request) {
	var req ReorderSessionExercisesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	ids := make([]pgtype.UUID, 0, len(req.IDs))
	for _, s := range req.IDs {
		id, err := parseUUID(s)
		if err != nil {
			writeErrors(w, http.StatusBadRequest, map[string]string{"ids": "invalid id"})
			return
		}
		ids = append(ids, id)
	}

	if err := h.queries.ReorderWorkoutSessionExercises(r.Context(), ids); err != nil {
		writeInternalError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) updateSessionExercise(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	var req UpdateSessionExerciseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	row, err := h.queries.UpdateWorkoutSessionExercise(r.Context(), database.UpdateWorkoutSessionExerciseParams{
		ID:   id,
		Note: toTextPtr(req.Note),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusNotFound, map[string]string{"id": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	writeOne(w, http.StatusOK, row, toWorkoutSessionExerciseResponse)
}

// replaceSessionExercise swaps the Exercise at this slot for a different
// one, in place. Already-logged Sets for the old Exercise don't carry
// over — they were logged against a different Exercise.
func (h *Handler) replaceSessionExercise(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	var req ReplaceSessionExerciseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	exerciseID, err := parseUUID(req.ExerciseID)
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"exerciseId": "invalid id"})
		return
	}

	exercise, err := h.queries.GetExercise(r.Context(), exerciseID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"exerciseId": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	if err := h.queries.DeleteWorkoutSetsBySessionExercise(r.Context(), id); err != nil {
		writeInternalError(w, err)
		return
	}

	row, err := h.queries.ReplaceWorkoutSessionExerciseExercise(r.Context(), database.ReplaceWorkoutSessionExerciseExerciseParams{
		ID:           id,
		ExerciseID:   exerciseID,
		ExerciseName: exercise.Name,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusNotFound, map[string]string{"id": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	writeOne(w, http.StatusOK, row, toWorkoutSessionExerciseResponse)
}

func (h *Handler) removeSessionExercise(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	if err := h.queries.DeleteWorkoutSessionExercise(r.Context(), id); err != nil {
		writeInternalError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) listSetsForSessionExercise(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	rows, err := h.queries.ListWorkoutSetsBySessionExercise(r.Context(), id)
	if err != nil {
		writeInternalError(w, err)
		return
	}
	writeList(w, rows, toWorkoutSetResponse)
}

// ---- sets ----

func (h *Handler) createSet(w http.ResponseWriter, r *http.Request) {
	var req CreateWorkoutSetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if errs := validateCreateWorkoutSet(req); len(errs) > 0 {
		writeErrors(w, http.StatusUnprocessableEntity, errs)
		return
	}

	sessionExerciseID, err := parseUUID(req.SessionExerciseID)
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"sessionExerciseId": "invalid id"})
		return
	}

	weightKg, err := toNumericPtr(req.WeightKg)
	if err != nil {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"weightKg": "invalid number"})
		return
	}
	distanceM, err := toNumericPtr(req.DistanceM)
	if err != nil {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"distanceM": "invalid number"})
		return
	}

	row, err := h.queries.CreateWorkoutSet(r.Context(), database.CreateWorkoutSetParams{
		SessionExerciseID: sessionExerciseID,
		SetType:           req.SetType,
		WeightKg:          weightKg,
		Reps:              toInt4Ptr(req.Reps),
		DurationSec:       toInt4Ptr(req.DurationSec),
		DistanceM:         distanceM,
		Note:              toTextPtr(req.Note),
	})
	if err != nil {
		writeInternalError(w, err)
		return
	}

	writeOne(w, http.StatusCreated, row, toWorkoutSetResponse)
}

func (h *Handler) updateSet(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	var req UpdateWorkoutSetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if req.SetType != nil {
		if errs := validateSetType(*req.SetType); len(errs) > 0 {
			writeErrors(w, http.StatusUnprocessableEntity, errs)
			return
		}
	}

	weightKg, err := toNumericPtr(req.WeightKg)
	if err != nil {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"weightKg": "invalid number"})
		return
	}
	distanceM, err := toNumericPtr(req.DistanceM)
	if err != nil {
		writeErrors(w, http.StatusUnprocessableEntity, map[string]string{"distanceM": "invalid number"})
		return
	}

	row, err := h.queries.UpdateWorkoutSet(r.Context(), database.UpdateWorkoutSetParams{
		ID:          id,
		SetType:     toTextPtr(req.SetType),
		Confirmed:   toBoolPtr(req.Confirmed),
		WeightKg:    weightKg,
		Reps:        toInt4Ptr(req.Reps),
		DurationSec: toInt4Ptr(req.DurationSec),
		DistanceM:   distanceM,
		Note:        toTextPtr(req.Note),
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeErrors(w, http.StatusNotFound, map[string]string{"id": "not found"})
			return
		}
		writeInternalError(w, err)
		return
	}

	writeOne(w, http.StatusOK, row, toWorkoutSetResponse)
}

func (h *Handler) deleteSet(w http.ResponseWriter, r *http.Request) {
	id, err := parseUUID(r.PathValue("id"))
	if err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"id": "invalid id"})
		return
	}

	if err := h.queries.DeleteWorkoutSet(r.Context(), id); err != nil {
		writeInternalError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ---- template ↔ session snapshot helpers ----
// Shared by createSession (template → session) and
// updateSourceTemplate/saveAsTemplate (session → template) — both
// directions copy the same shape (an ordered list of exercises, each with
// its ordered sets), just in opposite directions.

type exerciseSnapshot struct {
	exerciseID   pgtype.UUID
	exerciseName string
	sets         []database.WorkoutSet
}

func (h *Handler) snapshotSession(ctx context.Context, sessionID pgtype.UUID) ([]exerciseSnapshot, error) {
	sessionExercises, err := h.queries.ListWorkoutSessionExercises(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	snapshot := make([]exerciseSnapshot, 0, len(sessionExercises))
	for _, se := range sessionExercises {
		sets, err := h.queries.ListWorkoutSetsBySessionExercise(ctx, se.ID)
		if err != nil {
			return nil, err
		}
		snapshot = append(snapshot, exerciseSnapshot{
			exerciseID:   se.ExerciseID,
			exerciseName: se.ExerciseName,
			sets:         sets,
		})
	}
	return snapshot, nil
}

func (h *Handler) writeTemplateSets(ctx context.Context, templateID pgtype.UUID, snapshot []exerciseSnapshot) error {
	var position int32
	for _, ex := range snapshot {
		for _, set := range ex.sets {
			_, err := h.queries.CreateWorkoutTemplateSet(ctx, database.CreateWorkoutTemplateSetParams{
				TemplateID:   templateID,
				ExerciseID:   ex.exerciseID,
				ExerciseName: ex.exerciseName,
				Position:     position,
				SetType:      set.SetType,
				WeightKg:     set.WeightKg,
				Reps:         set.Reps,
				DurationSec:  set.DurationSec,
				DistanceM:    set.DistanceM,
			})
			if err != nil {
				return err
			}
			position++
		}
	}
	return nil
}

// seedSessionFromTemplate copies a Template's suggested sets into fresh
// session-exercises/sets, grouping consecutive template_sets rows sharing
// an exercise into one session-exercise — matching exactly how
// writeTemplateSets lays them out in the first place. Every seeded Set
// starts unconfirmed (pending-rows-you-confirm).
func (h *Handler) seedSessionFromTemplate(ctx context.Context, sessionID, templateID pgtype.UUID) error {
	templateSets, err := h.queries.ListWorkoutTemplateSets(ctx, templateID)
	if err != nil {
		return err
	}

	var currentSessionExerciseID pgtype.UUID
	var currentExerciseID pgtype.UUID
	var currentExerciseName string
	haveCurrent := false

	for _, ts := range templateSets {
		sameGroup := haveCurrent &&
			ts.ExerciseID.Valid == currentExerciseID.Valid &&
			ts.ExerciseID.Bytes == currentExerciseID.Bytes &&
			ts.ExerciseName == currentExerciseName

		if !sameGroup {
			se, err := h.queries.CreateWorkoutSessionExercise(ctx, database.CreateWorkoutSessionExerciseParams{
				SessionID:    sessionID,
				ExerciseID:   ts.ExerciseID,
				ExerciseName: ts.ExerciseName,
			})
			if err != nil {
				return err
			}
			currentSessionExerciseID = se.ID
			currentExerciseID = ts.ExerciseID
			currentExerciseName = ts.ExerciseName
			haveCurrent = true
		}

		_, err := h.queries.CreateWorkoutSet(ctx, database.CreateWorkoutSetParams{
			SessionExerciseID: currentSessionExerciseID,
			SetType:           ts.SetType,
			WeightKg:          ts.WeightKg,
			Reps:              ts.Reps,
			DurationSec:       ts.DurationSec,
			DistanceM:         ts.DistanceM,
		})
		if err != nil {
			return err
		}
	}
	return nil
}

// ---- shared response plumbing ----

func writeOne[Row any, Resp any](w http.ResponseWriter, status int, row Row, convert func(Row) (Resp, error)) {
	resp, err := convert(row)
	if err != nil {
		writeInternalError(w, err)
		return
	}
	writeJSON(w, status, resp)
}

func writeList[Row any, Resp any](w http.ResponseWriter, rows []Row, convert func(Row) (Resp, error)) {
	resp := make([]Resp, 0, len(rows))
	for _, row := range rows {
		item, err := convert(row)
		if err != nil {
			writeInternalError(w, err)
			return
		}
		resp = append(resp, item)
	}
	writeJSON(w, http.StatusOK, resp)
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("training: failed to encode response: %v", err)
	}
}

func writeErrors(w http.ResponseWriter, status int, errs map[string]string) {
	writeJSON(w, status, map[string]any{"errors": errs})
}

func writeInternalError(w http.ResponseWriter, err error) {
	log.Printf("training: internal error: %v", err)
	writeErrors(w, http.StatusInternalServerError, map[string]string{"server": "internal error"})
}
