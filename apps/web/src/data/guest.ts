// Guest mode's session flag only — not its data (see guest-client.ts). The
// first use of browser storage in this codebase; keep it this small and
// don't grow it into a general client-storage abstraction.
const GUEST_KEY = "selfos:guest";

// Evaluated at call time, never cached — set by a click handler after the
// module graph is already initialized, and must survive the hard
// navigation from /login to /home.
export function isGuestSession(): boolean {
  return sessionStorage.getItem(GUEST_KEY) === "1";
}

export function enterGuestSession(): void {
  sessionStorage.setItem(GUEST_KEY, "1");
}

export function exitGuestSession(): void {
  sessionStorage.removeItem(GUEST_KEY);
}
