package auth

import "golang.org/x/crypto/bcrypt"

// VerifyPassword checks a submitted password against the bcrypt hash in
// AUTH_PASSWORD_HASH. Single user, no users table (decision 07 on the neon
// map) — the hash is the only stored credential.
func VerifyPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
