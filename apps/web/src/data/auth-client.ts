import { parseOrThrow } from "@/data/http";

const LOGIN_URL = "/api/login";
const LOGOUT_URL = "/api/logout";
const SESSION_URL = "/api/session";

// redirectOn401: false — a wrong password from this exact endpoint means
// "not logged in yet", not "session expired". Every other caller of
// parseOrThrow wants the default (redirect), this is the one exception.
export async function login(password: string): Promise<void> {
  const response = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  await parseOrThrow(response, { redirectOn401: false });
}

// Always ends in a full page navigation to /login, regardless of the
// request's own outcome — the point is to leave the authenticated app, and
// a hard reload clears the TanStack Query cache and all other in-memory
// state for free (ticket 09 §6).
export async function logout(): Promise<void> {
  await fetch(LOGOUT_URL, { method: "POST" });
  window.location.assign("/login");
}

// Used by the route-protection loader (app/router.tsx) to answer "am I
// logged in" — the cookie is HttpOnly, so that's the only way to ask
// (ticket 09 §3). A real 401 triggers parseOrThrow's redirect already; a
// raw network failure (offline) rejects before parseOrThrow ever runs, so
// the loader can tell the two apart without any special-casing here.
export async function checkSession(): Promise<void> {
  const response = await fetch(SESSION_URL);
  await parseOrThrow(response);
}
