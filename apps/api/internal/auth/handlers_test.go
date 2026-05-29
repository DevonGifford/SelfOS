package auth

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// bcrypt hash of testCorrectPassword, generated for this test only (same
// hash as password_test.go's TestVerifyPassword — same password, verified there).
const testPasswordHash = "$2a$10$1Fu8htZnVf3rMZRB0wbNU.xDVbRNuwNsZ3EA03Z0Lv2mEn7YECOIq"

const testCorrectPassword = "correct-horse-battery-staple"

func doHandlerRequest(h *Handler, method, path string, body any) *httptest.ResponseRecorder {
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

func TestLoginRejectsWrongPassword(t *testing.T) {
	h := NewHandler(testPasswordHash, testSecret)

	rec := doHandlerRequest(h, http.MethodPost, "/api/login", loginRequest{Password: "wrong"})

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
	if len(rec.Result().Cookies()) > 0 {
		t.Fatal("expected no session cookie to be set for a wrong password")
	}
}

func TestLoginSetsWorkingSessionCookie(t *testing.T) {
	h := NewHandler(testPasswordHash, testSecret)

	rec := doHandlerRequest(h, http.MethodPost, "/api/login", loginRequest{Password: testCorrectPassword})

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}

	cookies := rec.Result().Cookies()
	if len(cookies) != 1 || cookies[0].Name != SessionCookieName {
		t.Fatalf("expected a %s cookie, got %v", SessionCookieName, cookies)
	}

	if err := VerifySessionValue(testSecret, cookies[0].Value); err != nil {
		t.Fatalf("expected the set cookie to verify, got: %v", err)
	}
}

func TestSessionEndpointReflectsCookieValidity(t *testing.T) {
	h := NewHandler(testPasswordHash, testSecret)

	noCookieRec := doHandlerRequest(h, http.MethodGet, "/api/session", nil)
	if noCookieRec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 with no cookie, got %d", noCookieRec.Code)
	}

	mux := http.NewServeMux()
	h.Register(mux)
	req := httptest.NewRequest(http.MethodGet, "/api/session", nil)
	req.AddCookie(&http.Cookie{Name: SessionCookieName, Value: NewSessionValue(testSecret)})
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 with a valid cookie, got %d", rec.Code)
	}
}

func TestLogoutClearsCookie(t *testing.T) {
	h := NewHandler(testPasswordHash, testSecret)

	rec := doHandlerRequest(h, http.MethodPost, "/api/logout", nil)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}

	cookies := rec.Result().Cookies()
	if len(cookies) != 1 || cookies[0].MaxAge >= 0 {
		t.Fatalf("expected a clearing cookie (negative MaxAge), got %v", cookies)
	}
}
