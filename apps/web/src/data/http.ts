// Shared by every real (non-demo) domain client — extracted once a second
// domain (auth) needed the exact same fetch/parse/error shape as
// measurements, matching the seam-discipline principle from ticket 04: one
// adapter is a hypothetical seam, two adapters is a real one.

// Structured field-level errors from the API surface here so callers can
// show inline per-field messages instead of a generic failure.
export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;

  constructor(status: number, body: unknown) {
    const fieldErrors = isErrorBody(body) ? body.errors : {};
    super(Object.values(fieldErrors)[0] ?? `Request failed with status ${status}`);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function isErrorBody(body: unknown): body is { errors: Record<string, string> } {
  return (
    typeof body === "object" &&
    body !== null &&
    "errors" in body &&
    typeof (body as { errors: unknown }).errors === "object"
  );
}

type ParseOptions = {
  // The login endpoint's own 401 (wrong password) must not redirect — the
  // user is already on /login and just needs the inline error. Every other
  // 401 (a dead session hitting a real endpoint, including the route-guard
  // loader's session check and the optimistic-mutation undo callbacks in
  // use-measurement-mutations.ts) means the session actually expired.
  redirectOn401?: boolean;
};

// A 401 means the session died — a raw network failure (offline) rejects
// fetch() itself before this ever runs, so it never reaches here (ticket
// 09 §5's offline/expired split). Redirects via a full page navigation
// rather than SPA routing so every call site gets this for free without
// its own 401-awareness, and so the TanStack Query cache and all other
// in-memory state get wiped along with it (ticket 09 §4/§6).
export async function parseOrThrow(response: Response, options: ParseOptions = {}) {
  const { redirectOn401 = true } = options;
  const body = await response.json().catch(() => null);

  if (response.status === 401 && redirectOn401) {
    window.location.assign("/login");
  }

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }

  return body;
}
