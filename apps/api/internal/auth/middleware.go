package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5"

	"github.com/DevonGifford/SelfOS/apps/api/internal/database"
)

// HashToken hashes a bearer token for storage/lookup — only the hash is
// ever persisted (decision 07 on the neon map), never the plaintext token.
func HashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

// Require wraps next so it only runs for an authenticated request: a valid
// session cookie (the single web user, full access) or a valid, unrevoked
// bearer token whose scope allows the request's method. Behavior for an
// already-authenticated request is unchanged either way — this only adds
// the 401 path for everyone else.
func Require(secret []byte, queries *database.Queries) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if cookie, err := r.Cookie(SessionCookieName); err == nil {
				if VerifySessionValue(secret, cookie.Value) == nil {
					next.ServeHTTP(w, r)
					return
				}
			}

			if token, ok := bearerToken(r); ok {
				tok, err := queries.GetTokenByHash(r.Context(), HashToken(token))
				if err == nil && tokenAllows(tok.Scope, r.Method) {
					next.ServeHTTP(w, r)
					return
				}
				if err != nil && !errors.Is(err, pgx.ErrNoRows) {
					writeInternalError(w, err)
					return
				}
			}

			writeErrors(w, http.StatusUnauthorized, map[string]string{"auth": "unauthorized"})
		})
	}
}

func bearerToken(r *http.Request) (string, bool) {
	const prefix = "Bearer "
	h := r.Header.Get("Authorization")
	if !strings.HasPrefix(h, prefix) {
		return "", false
	}
	return strings.TrimPrefix(h, prefix), true
}

func tokenAllows(scope database.TokenScope, method string) bool {
	if scope == database.TokenScopeReadWrite {
		return true
	}
	return method == http.MethodGet || method == http.MethodHead
}
