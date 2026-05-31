package configuration

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
// at the end of the test — same isolation habits/measurements/nutrition
// all use.
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

func TestGetConfiguration(t *testing.T) {
	h := testHandler(t)

	rec := doRequest(h, http.MethodGet, "/api/configuration", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp Response
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}

	// The migration seeds the one row itself — no setup needed, and the
	// seeded row is always present regardless of what any other test does.
	if resp.NutritionCaloriesTarget <= 0 || resp.NutritionProteinTarget <= 0 ||
		resp.NutritionCarbsTarget <= 0 || resp.NutritionFatTarget <= 0 {
		t.Fatalf("expected positive seeded defaults, got %+v", resp)
	}
}

func TestUpdateConfiguration(t *testing.T) {
	h := testHandler(t)

	rec := doRequest(h, http.MethodPatch, "/api/configuration", Request{
		NutritionCaloriesTarget: 2500,
		NutritionProteinTarget:  180,
		NutritionCarbsTarget:    250,
		NutritionFatTarget:      80,
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp Response
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.NutritionCaloriesTarget != 2500 || resp.NutritionProteinTarget != 180 ||
		resp.NutritionCarbsTarget != 250 || resp.NutritionFatTarget != 80 {
		t.Fatalf("update did not apply, got %+v", resp)
	}

	getRec := doRequest(h, http.MethodGet, "/api/configuration", nil)
	var getResp Response
	if err := json.Unmarshal(getRec.Body.Bytes(), &getResp); err != nil {
		t.Fatalf("decode get: %v", err)
	}
	if getResp != resp {
		t.Fatalf("get after update mismatch: got %+v, want %+v", getResp, resp)
	}
}

func TestUpdateConfigurationRejectsNonPositive(t *testing.T) {
	h := testHandler(t)

	rec := doRequest(h, http.MethodPatch, "/api/configuration", Request{
		NutritionCaloriesTarget: 0,
		NutritionProteinTarget:  180,
		NutritionCarbsTarget:    250,
		NutritionFatTarget:      80,
	})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
}
