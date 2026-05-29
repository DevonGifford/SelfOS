package auth

import (
	"encoding/json"
	"log"
	"net/http"
)

// Handler serves the login/logout/session-check routes. passwordHash and
// secret come from AUTH_PASSWORD_HASH and SESSION_SECRET — env vars, no
// users table (decision 07 on the neon map).
type Handler struct {
	passwordHash string
	secret       []byte
}

func NewHandler(passwordHash string, secret []byte) *Handler {
	return &Handler{passwordHash: passwordHash, secret: secret}
}

// Register wires the three routes onto mux. Deliberately unauthenticated —
// these are how you become authenticated, or check whether you already are.
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/login", h.login)
	mux.HandleFunc("POST /api/logout", h.logout)
	mux.HandleFunc("GET /api/session", h.session)
}

type loginRequest struct {
	Password string `json:"password"`
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErrors(w, http.StatusBadRequest, map[string]string{"body": "invalid JSON"})
		return
	}

	if !VerifyPassword(h.passwordHash, req.Password) {
		writeErrors(w, http.StatusUnauthorized, map[string]string{"password": "incorrect"})
		return
	}

	setSessionCookie(w, r, NewSessionValue(h.secret), int(SessionDuration.Seconds()))
	w.WriteHeader(http.StatusNoContent)
}

// logout clears the cookie server-side. Required, not optional — the
// cookie is HttpOnly, so client JS cannot clear it under any circumstances.
func (h *Handler) logout(w http.ResponseWriter, r *http.Request) {
	setSessionCookie(w, r, "", -1)
	w.WriteHeader(http.StatusNoContent)
}

// session answers "am I logged in" for the web client's route-protection
// loader — nothing else in this ticket's scope exposes that, and the
// cookie's HttpOnly flag means the client can't just check for it itself.
func (h *Handler) session(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(SessionCookieName)
	if err != nil || VerifySessionValue(h.secret, cookie.Value) != nil {
		writeErrors(w, http.StatusUnauthorized, map[string]string{"auth": "unauthorized"})
		return
	}
	w.WriteHeader(http.StatusOK)
}

func setSessionCookie(w http.ResponseWriter, r *http.Request, value string, maxAgeSeconds int) {
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    value,
		Path:     "/",
		HttpOnly: true,
		Secure:   r.TLS != nil,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   maxAgeSeconds,
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("auth: failed to encode response: %v", err)
	}
}

func writeErrors(w http.ResponseWriter, status int, errs map[string]string) {
	writeJSON(w, status, map[string]any{"errors": errs})
}

func writeInternalError(w http.ResponseWriter, err error) {
	log.Printf("auth: internal error: %v", err)
	writeErrors(w, http.StatusInternalServerError, map[string]string{"server": "internal error"})
}
