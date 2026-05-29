package auth

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"

	"github.com/DevonGifford/SelfOS/apps/api/internal/database"
)

// testQueries opens a connection, begins a transaction, and rolls it back
// at the end of the test — same pattern as internal/database and
// internal/measurements (decision 03/Q29 on the map: transaction-per-test,
// no testcontainers).
func testQueries(t *testing.T) *database.Queries {
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

	return database.New(tx)
}

var testSecret = []byte("middleware-test-secret")

func protectedTestHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
}

func TestRequireRejectsUnauthenticated(t *testing.T) {
	q := testQueries(t)
	handler := Require(testSecret, q)(protectedTestHandler())

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestRequireAcceptsValidSessionCookie(t *testing.T) {
	q := testQueries(t)
	handler := Require(testSecret, q)(protectedTestHandler())

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.AddCookie(&http.Cookie{Name: SessionCookieName, Value: NewSessionValue(testSecret)})
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

func TestRequireRejectsInvalidSessionCookie(t *testing.T) {
	q := testQueries(t)
	handler := Require(testSecret, q)(protectedTestHandler())

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.AddCookie(&http.Cookie{Name: SessionCookieName, Value: "garbage"})
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
}

func TestRequireReadOnlyTokenCanReadNotWrite(t *testing.T) {
	q := testQueries(t)

	const plaintext = "test-read-only-token"
	_, err := q.CreateToken(context.Background(), database.CreateTokenParams{
		TokenHash: HashToken(plaintext),
		Label:     "test read-only token",
		Scope:     database.TokenScopeReadOnly,
	})
	if err != nil {
		t.Fatalf("create token: %v", err)
	}

	handler := Require(testSecret, q)(protectedTestHandler())

	get := httptest.NewRequest(http.MethodGet, "/protected", nil)
	get.Header.Set("Authorization", "Bearer "+plaintext)
	getRec := httptest.NewRecorder()
	handler.ServeHTTP(getRec, get)
	if getRec.Code != http.StatusOK {
		t.Fatalf("expected read-only token to GET successfully, got %d", getRec.Code)
	}

	post := httptest.NewRequest(http.MethodPost, "/protected", nil)
	post.Header.Set("Authorization", "Bearer "+plaintext)
	postRec := httptest.NewRecorder()
	handler.ServeHTTP(postRec, post)
	if postRec.Code != http.StatusUnauthorized {
		t.Fatalf("expected read-only token to be rejected on POST, got %d", postRec.Code)
	}
}

func TestRequireReadWriteTokenCanDoBoth(t *testing.T) {
	q := testQueries(t)

	const plaintext = "test-read-write-token"
	_, err := q.CreateToken(context.Background(), database.CreateTokenParams{
		TokenHash: HashToken(plaintext),
		Label:     "test read-write token",
		Scope:     database.TokenScopeReadWrite,
	})
	if err != nil {
		t.Fatalf("create token: %v", err)
	}

	handler := Require(testSecret, q)(protectedTestHandler())

	for _, method := range []string{http.MethodGet, http.MethodPost} {
		req := httptest.NewRequest(method, "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+plaintext)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected read-write token to succeed on %s, got %d", method, rec.Code)
		}
	}
}

func TestRequireRejectsRevokedToken(t *testing.T) {
	q := testQueries(t)

	const plaintext = "test-revoked-token"
	created, err := q.CreateToken(context.Background(), database.CreateTokenParams{
		TokenHash: HashToken(plaintext),
		Label:     "test revoked token",
		Scope:     database.TokenScopeReadWrite,
	})
	if err != nil {
		t.Fatalf("create token: %v", err)
	}

	if err := q.RevokeToken(context.Background(), created.ID); err != nil {
		t.Fatalf("revoke token: %v", err)
	}

	handler := Require(testSecret, q)(protectedTestHandler())

	req := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+plaintext)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected revoked token to be rejected, got %d", rec.Code)
	}
}
