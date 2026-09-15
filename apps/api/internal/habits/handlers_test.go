package habits

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"

	"github.com/DevonGifford/SelfOS/apps/api/internal/database"
)

// testHandler opens a connection, begins a transaction, and rolls it back
// at the end of the test — no committed writes, mirrors measurements'
// handlers_test.go. Also clears this domain's tables inside the
// transaction before returning, so tests get a deterministic empty view
// regardless of real rows logged through the app locally — the delete
// itself rolls back with everything else, so real data is untouched.
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

	if _, err := tx.Exec(context.Background(), `delete from habit_entries; delete from habits;`); err != nil {
		t.Fatalf("clear habits tables: %v", err)
	}

	return NewHandler(database.New(tx))
}

// noAuth is a passthrough — these tests are about habits logic, not auth.
// Real wiring (main.go) uses auth.Require instead.
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

func createHabit(t *testing.T, h *Handler, name string) Response {
	t.Helper()
	rec := doRequest(h, http.MethodPost, "/api/habits", CreateRequest{Name: name})
	if rec.Code != http.StatusCreated {
		t.Fatalf("create habit %q: expected 201, got %d: %s", name, rec.Code, rec.Body.String())
	}
	var resp Response
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode create response: %v", err)
	}
	return resp
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

func TestCreateHabit(t *testing.T) {
	h := testHandler(t)

	resp := createHabit(t, h, "Morning walk")
	if resp.Name != "Morning walk" || !resp.Active || resp.ID == "" || resp.CreatedAt == "" {
		t.Fatalf("unexpected response: %+v", resp)
	}
	if resp.Position != 0 {
		t.Fatalf("expected first habit at position 0, got %d", resp.Position)
	}
}

func TestCreateHabitAppendsPosition(t *testing.T) {
	h := testHandler(t)

	first := createHabit(t, h, "Morning walk")
	second := createHabit(t, h, "Read 20 min")

	if first.Position != 0 || second.Position != 1 {
		t.Fatalf("expected positions 0,1, got %d,%d", first.Position, second.Position)
	}
}

func TestCreateHabitValidation(t *testing.T) {
	h := testHandler(t)

	rec := doRequest(h, http.MethodPost, "/api/habits", CreateRequest{Name: ""})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
	if _, ok := decodeErrors(t, rec)["name"]; !ok {
		t.Fatalf("expected error on field name, got %v", decodeErrors(t, rec))
	}
}

func TestCreateHabitMaxActive(t *testing.T) {
	h := testHandler(t)

	for i := 0; i < maxActiveHabits; i++ {
		createHabit(t, h, fmt.Sprintf("Habit %d", i))
	}

	rec := doRequest(h, http.MethodPost, "/api/habits", CreateRequest{Name: "One too many"})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
	if _, ok := decodeErrors(t, rec)["active"]; !ok {
		t.Fatalf("expected error on field active, got %v", decodeErrors(t, rec))
	}
}

func TestListHabits(t *testing.T) {
	h := testHandler(t)

	createHabit(t, h, "Morning walk")
	createHabit(t, h, "Read 20 min")

	rec := doRequest(h, http.MethodGet, "/api/habits", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var resp []Response
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp) != 2 {
		t.Fatalf("expected 2 habits, got %d", len(resp))
	}
}

func TestUpdateHabitRename(t *testing.T) {
	h := testHandler(t)

	created := createHabit(t, h, "Morning walk")

	newName := "Morning jog"
	rec := doRequest(h, http.MethodPatch, "/api/habits/"+created.ID, UpdateRequest{Name: &newName})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var updated Response
	if err := json.Unmarshal(rec.Body.Bytes(), &updated); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if updated.Name != "Morning jog" || !updated.Active {
		t.Fatalf("unexpected response: %+v", updated)
	}
}

func TestUpdateHabitNotFound(t *testing.T) {
	h := testHandler(t)

	newName := "Anything"
	rec := doRequest(h, http.MethodPatch, "/api/habits/00000000-0000-0000-0000-000000000000", UpdateRequest{Name: &newName})
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestUpdateHabitDeactivateBelowMin(t *testing.T) {
	h := testHandler(t)

	a := createHabit(t, h, "Habit A")
	createHabit(t, h, "Habit B")
	createHabit(t, h, "Habit C")

	inactive := false
	rec := doRequest(h, http.MethodPatch, "/api/habits/"+a.ID, UpdateRequest{Active: &inactive})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
	if _, ok := decodeErrors(t, rec)["active"]; !ok {
		t.Fatalf("expected error on field active, got %v", decodeErrors(t, rec))
	}
}

func TestUpdateHabitDeactivateAboveMin(t *testing.T) {
	h := testHandler(t)

	a := createHabit(t, h, "Habit A")
	createHabit(t, h, "Habit B")
	createHabit(t, h, "Habit C")
	createHabit(t, h, "Habit D")

	inactive := false
	rec := doRequest(h, http.MethodPatch, "/api/habits/"+a.ID, UpdateRequest{Active: &inactive})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var updated Response
	if err := json.Unmarshal(rec.Body.Bytes(), &updated); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if updated.Active {
		t.Fatalf("expected habit to be inactive, got %+v", updated)
	}
}

func TestUpdateHabitReactivateAboveMax(t *testing.T) {
	h := testHandler(t)

	// Deactivating requires staying at/above the min (3), so get an
	// inactive habit the only valid way: create 4, deactivate 1 (4-1=3,
	// exactly at the floor), leaving 3 active + 1 inactive ("extra").
	createHabit(t, h, "Habit A")
	createHabit(t, h, "Habit B")
	createHabit(t, h, "Habit C")
	extra := createHabit(t, h, "Extra habit")

	inactive := false
	deactivateRec := doRequest(h, http.MethodPatch, "/api/habits/"+extra.ID, UpdateRequest{Active: &inactive})
	if deactivateRec.Code != http.StatusOK {
		t.Fatalf("setup: expected 200 deactivating extra habit, got %d: %s", deactivateRec.Code, deactivateRec.Body.String())
	}

	// Now 3 active. Fill up to the max (10) with 7 more active habits.
	for i := 0; i < maxActiveHabits-minActiveHabits; i++ {
		createHabit(t, h, fmt.Sprintf("Habit %d", i))
	}

	active := true
	rec := doRequest(h, http.MethodPatch, "/api/habits/"+extra.ID, UpdateRequest{Active: &active})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
	if _, ok := decodeErrors(t, rec)["active"]; !ok {
		t.Fatalf("expected error on field active, got %v", decodeErrors(t, rec))
	}
}

func TestReorderHabits(t *testing.T) {
	h := testHandler(t)

	a := createHabit(t, h, "A")
	b := createHabit(t, h, "B")
	c := createHabit(t, h, "C")

	rec := doRequest(h, http.MethodPost, "/api/habits/reorder", ReorderRequest{IDs: []string{c.ID, a.ID, b.ID}})
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d: %s", rec.Code, rec.Body.String())
	}

	listRec := doRequest(h, http.MethodGet, "/api/habits", nil)
	var resp []Response
	if err := json.Unmarshal(listRec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp) != 3 || resp[0].ID != c.ID || resp[1].ID != a.ID || resp[2].ID != b.ID {
		t.Fatalf("unexpected order: %+v", resp)
	}
}

func TestCreateAndListEntries(t *testing.T) {
	h := testHandler(t)

	habit := createHabit(t, h, "Morning walk")

	rec := doRequest(h, http.MethodPost, "/api/habits/entries", CreateEntryRequest{HabitID: habit.ID, Date: "2026-09-14"})
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
	}

	var entry EntryResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &entry); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if entry.HabitID != habit.ID || entry.Date != "2026-09-14" || entry.ID == "" {
		t.Fatalf("unexpected entry: %+v", entry)
	}

	listRec := doRequest(h, http.MethodGet, "/api/habits/entries", nil)
	var entries []EntryResponse
	if err := json.Unmarshal(listRec.Body.Bytes(), &entries); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	if len(entries) != 1 {
		t.Fatalf("expected 1 entry, got %d", len(entries))
	}
}

func TestCreateEntryDuplicateRejected(t *testing.T) {
	h := testHandler(t)

	habit := createHabit(t, h, "Morning walk")

	first := doRequest(h, http.MethodPost, "/api/habits/entries", CreateEntryRequest{HabitID: habit.ID, Date: "2026-09-14"})
	if first.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", first.Code, first.Body.String())
	}

	second := doRequest(h, http.MethodPost, "/api/habits/entries", CreateEntryRequest{HabitID: habit.ID, Date: "2026-09-14"})
	if second.Code != http.StatusConflict {
		t.Fatalf("expected 409, got %d: %s", second.Code, second.Body.String())
	}
}

func TestCreateEntryFutureDateRejected(t *testing.T) {
	h := testHandler(t)

	habit := createHabit(t, h, "Morning walk")

	rec := doRequest(h, http.MethodPost, "/api/habits/entries", CreateEntryRequest{HabitID: habit.ID, Date: "2099-01-01"})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestDeleteEntry(t *testing.T) {
	h := testHandler(t)

	habit := createHabit(t, h, "Morning walk")
	createRec := doRequest(h, http.MethodPost, "/api/habits/entries", CreateEntryRequest{HabitID: habit.ID, Date: "2026-09-14"})
	var entry EntryResponse
	if err := json.Unmarshal(createRec.Body.Bytes(), &entry); err != nil {
		t.Fatalf("decode create response: %v", err)
	}

	rec := doRequest(h, http.MethodDelete, "/api/habits/entries/"+entry.ID, nil)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}

	listRec := doRequest(h, http.MethodGet, "/api/habits/entries", nil)
	var entries []EntryResponse
	if err := json.Unmarshal(listRec.Body.Bytes(), &entries); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	for _, e := range entries {
		if e.ID == entry.ID {
			t.Fatal("deleted entry still present in list")
		}
	}
}
