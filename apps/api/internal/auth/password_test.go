package auth

import "testing"

func TestVerifyPassword(t *testing.T) {
	// bcrypt hash of "correct-horse-battery-staple", generated for this test only.
	const hash = "$2a$10$1Fu8htZnVf3rMZRB0wbNU.xDVbRNuwNsZ3EA03Z0Lv2mEn7YECOIq"

	if !VerifyPassword(hash, "correct-horse-battery-staple") {
		t.Fatal("expected correct password to verify")
	}

	if VerifyPassword(hash, "wrong-password") {
		t.Fatal("expected wrong password to fail verification")
	}
}
