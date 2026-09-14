package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"strconv"
	"strings"
	"time"
)

// SessionCookieName is the HttpOnly cookie carrying the signed session.
const SessionCookieName = "selfos_session"

// SessionDuration is fixed with no sliding renewal (decision 07 on the neon
// map) — a session dies exactly 30 days after login, full stop.
const SessionDuration = 30 * 24 * time.Hour

// Single user, so the signed payload's "subject" is a constant rather than
// a real user id — nothing to look up, just something to sign so the
// payload isn't just a bare timestamp.
const sessionSubject = "admin"

var ErrInvalidSession = errors.New("invalid or expired session")

func signPayload(secret []byte, payload string) string {
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

// NewSessionValue returns a fresh, validly-signed session cookie value.
func NewSessionValue(secret []byte) string {
	expiry := time.Now().Add(SessionDuration).Unix()
	payload := sessionSubject + ":" + strconv.FormatInt(expiry, 10)
	return payload + "." + signPayload(secret, payload)
}

// VerifySessionValue checks the HMAC signature and expiry of a session
// cookie value. A stateless check — no server-side session store, no
// revocation list; killing every outstanding session means rotating
// SESSION_SECRET, which is deliberate per decision 07 on the neon map.
func VerifySessionValue(secret []byte, value string) error {
	payload, sig, ok := strings.Cut(value, ".")
	if !ok {
		return ErrInvalidSession
	}

	if !hmac.Equal([]byte(sig), []byte(signPayload(secret, payload))) {
		return ErrInvalidSession
	}

	_, expiryStr, ok := strings.Cut(payload, ":")
	if !ok {
		return ErrInvalidSession
	}

	expiry, err := strconv.ParseInt(expiryStr, 10, 64)
	if err != nil {
		return ErrInvalidSession
	}

	if time.Now().Unix() > expiry {
		return ErrInvalidSession
	}

	return nil
}
