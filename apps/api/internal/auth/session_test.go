package auth

import (
	"strconv"
	"strings"
	"testing"
	"time"
)

func TestSessionRoundTrip(t *testing.T) {
	secret := []byte("test-secret")

	value := NewSessionValue(secret)
	if err := VerifySessionValue(secret, value); err != nil {
		t.Fatalf("expected fresh session to verify, got: %v", err)
	}
}

func TestSessionRejectsTamperedSignature(t *testing.T) {
	secret := []byte("test-secret")
	value := NewSessionValue(secret)

	payload, _, _ := strings.Cut(value, ".")
	tampered := payload + ".not-a-real-signature"

	if err := VerifySessionValue(secret, tampered); err == nil {
		t.Fatal("expected tampered signature to be rejected")
	}
}

func TestSessionRejectsWrongSecret(t *testing.T) {
	value := NewSessionValue([]byte("secret-a"))

	if err := VerifySessionValue([]byte("secret-b"), value); err == nil {
		t.Fatal("expected a session signed with a different secret to be rejected")
	}
}

func TestSessionRejectsExpired(t *testing.T) {
	secret := []byte("test-secret")
	pastExpiry := strconv.FormatInt(time.Now().Add(-time.Hour).Unix(), 10)
	payload := sessionSubject + ":" + pastExpiry
	expired := payload + "." + signPayload(secret, payload)

	if err := VerifySessionValue(secret, expired); err == nil {
		t.Fatal("expected expired session to be rejected")
	}
}

func TestSessionRejectsMalformedValue(t *testing.T) {
	secret := []byte("test-secret")

	for _, value := range []string{"", "no-dot-here", ".", "payload-with-no-colon.sig"} {
		if err := VerifySessionValue(secret, value); err == nil {
			t.Fatalf("expected malformed value %q to be rejected", value)
		}
	}
}
