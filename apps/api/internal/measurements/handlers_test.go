package measurements

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
// at the end of the test — no committed writes (decision 03/Q29).
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

	return NewHandler(database.New(tx))
}

func doRequest(h *Handler, method, path string, body any) *httptest.ResponseRecorder {
	mux := http.NewServeMux()
	h.Register(mux)

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

func TestCreateMeasurement(t *testing.T) {
	h := testHandler(t)

	rec := doRequest(h, http.MethodPost, "/api/measurements", Request{Date: "2026-09-09", Kg: 82.4})
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp Response
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Kg != 82.4 || resp.Date != "2026-09-09" || resp.ID == "" || resp.CreatedAt == "" {
		t.Fatalf("unexpected response: %+v", resp)
	}
}

func TestCreateMeasurementValidation(t *testing.T) {
	h := testHandler(t)

	tests := []struct {
		name    string
		req     Request
		wantErr string
	}{
		{"negative kg", Request{Date: "2026-09-09", Kg: -5}, "kg"},
		{"zero kg", Request{Date: "2026-09-09", Kg: 0}, "kg"},
		{"future date", Request{Date: "2099-01-01", Kg: 80}, "date"},
		{"malformed date", Request{Date: "not-a-date", Kg: 80}, "date"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec := doRequest(h, http.MethodPost, "/api/measurements", tt.req)
			if rec.Code != http.StatusUnprocessableEntity {
				t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
			}

			var body struct {
				Errors map[string]string `json:"errors"`
			}
			if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
				t.Fatalf("decode: %v", err)
			}
			if _, ok := body.Errors[tt.wantErr]; !ok {
				t.Fatalf("expected error on field %q, got %v", tt.wantErr, body.Errors)
			}
		})
	}
}

func TestListMeasurements(t *testing.T) {
	h := testHandler(t)

	doRequest(h, http.MethodPost, "/api/measurements", Request{Date: "2026-09-09", Kg: 82.4})
	doRequest(h, http.MethodPost, "/api/measurements", Request{Date: "2026-09-08", Kg: 82.6})

	rec := doRequest(h, http.MethodGet, "/api/measurements", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var resp []Response
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(resp))
	}
}

func TestUpdateMeasurement(t *testing.T) {
	h := testHandler(t)

	createRec := doRequest(h, http.MethodPost, "/api/measurements", Request{Date: "2026-09-09", Kg: 82.4})
	var created Response
	if err := json.Unmarshal(createRec.Body.Bytes(), &created); err != nil {
		t.Fatalf("decode create response: %v", err)
	}

	rec := doRequest(h, http.MethodPatch, "/api/measurements/"+created.ID, Request{Date: "2026-09-09", Kg: 81.9})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var updated Response
	if err := json.Unmarshal(rec.Body.Bytes(), &updated); err != nil {
		t.Fatalf("decode update response: %v", err)
	}
	if updated.Kg != 81.9 {
		t.Fatalf("expected 81.9, got %v", updated.Kg)
	}
}

func TestUpdateMeasurementNotFound(t *testing.T) {
	h := testHandler(t)

	rec := doRequest(h, http.MethodPatch, "/api/measurements/00000000-0000-0000-0000-000000000000", Request{Date: "2026-09-09", Kg: 80})
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestDeleteMeasurement(t *testing.T) {
	h := testHandler(t)

	createRec := doRequest(h, http.MethodPost, "/api/measurements", Request{Date: "2026-09-09", Kg: 82.4})
	var created Response
	if err := json.Unmarshal(createRec.Body.Bytes(), &created); err != nil {
		t.Fatalf("decode create response: %v", err)
	}

	rec := doRequest(h, http.MethodDelete, "/api/measurements/"+created.ID, nil)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}

	listRec := doRequest(h, http.MethodGet, "/api/measurements", nil)
	var resp []Response
	if err := json.Unmarshal(listRec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode list response: %v", err)
	}
	for _, r := range resp {
		if r.ID == created.ID {
			t.Fatal("deleted measurement still present in list")
		}
	}
}
