# Mobile Hand-off Brief — React Native + Expo

This is a briefing document for an AI agent (or developer) starting the React Native + Expo port of SelfOS. Read [`CONTEXT.md`](../CONTEXT.md) at the repo root first — it defines the domain vocabulary (Event vs Definition, Client Seam, Demo/Guest/Personal Mode, etc.) used throughout this doc and the codebase.

## Goal

Build a React Native (Expo) client that is **one-for-one** with the existing `apps/web` PWA: same screens, same flows, same data, same API. This is a faithful port, not a redesign. It reuses the existing Go API (`apps/api`) as-is — no new backend work unless called out below as a gap.

Tailwind equivalent for styling: **NativeWind** is the natural choice (same utility classes, same mental model as the web app's Tailwind v4 setup) — but that's a decision for whoever picks up this work, not fixed here.

## Current web client — tech stack

- React + Vite + TypeScript, `react-router` v8 (`createBrowserRouter`), TanStack Query (`@tanstack/react-query`) for all data fetching.
- Styling: Tailwind v4 (CSS-based config, no `tailwind.config.js`), shadcn/ui components built on **Base UI** (`@base-ui/react`, not Radix).
- Deployed as a PWA (installable, service worker) — see "What not to port" below.
- Single-user app, password login, no multi-tenant concerns.

## Screens / routes

| Path | Screen | Summary |
|---|---|---|
| `/login` | Login | Password-only form; "Guest Access" button bypasses auth entirely into an in-memory demo session. |
| `/home` | Home/Status | Today's rollup: habit ring, latest body weight, nutrition progress, last/in-progress workout, 30-day weight sparkline, habit heatmap. |
| `/nutrition` | Nutrition | Day-by-day (±7 days) food log by meal slot, calorie/protein header, add/edit drawers. |
| `/training` | Training | State machine: Start screen (pick type/template) → Logging screen (active session) → Finished screen (recap). |
| `/habits` | Habits | Day-by-day checklist with streaks; Edit mode for reorder/rename/archive. |
| `/measurements` | Measurements/Weight | Weight sparkline + month-by-month weigh-in journal. |
| `/settings` | Settings | Nutrition Targets (live); Measurement/Habit Targets (UI-only preview, no backing field yet); Training Targets (placeholder). |
| `*/history`, `barcode-scan`, `voice-log`, `meal-scan` | Coming Soon | Generic stub page — not built yet on web either, skip these. |

All routes except `/login` sit under a parent shell with a persistent bottom nav. Pages use a `?action=add` query param to deep-link into an add drawer — on RN this becomes navigation params instead.

## Navigation mapping

Web uses a fixed bottom bar with 3 slots (Menu, Home, Add) → maps directly to **React Navigation bottom tabs**, but note the actual nav model:
- **Menu** opens a slide-in drawer (`NavDrawer`) listing all domains + a contextual "this page" action + Settings + Log out. This is the real navigation hub, not the tab bar itself.
- **Home** is the one direct single-tap tab.
- **Add (+)** opens a bottom sheet (`QuickLogDrawer`) with quick-log shortcuts.

So: a bottom tab bar alone under-represents the nav model — budget for a drawer (`@react-navigation/drawer` or a custom sheet) and a bottom-sheet component (e.g. `@gorhom/bottom-sheet`) for Add, not just tabs.

Drawers on web use **real swipe-to-dismiss gestures** (Base UI drawer primitive, swipe direction + velocity-driven opacity/duration). This has no CSS equivalent — it's the one interaction that needs genuine reimplementation via `react-native-gesture-handler` + `react-native-reanimated`, not a style-only port.

## Design system

No brand color — the entire app is **achromatic grayscale**, **dark-mode only** (light theme CSS vars exist but are unused; `<html class="dark">` is hardcoded, no toggle). Visual identity comes from typography + borders, not color or shadows.

- **Fonts** (self-hosted, no CDN): body/UI font is **monospace** — `Share Tech Mono` — not a conventional sans. Headings use `Archivo Black`, always uppercase. Both are loadable in Expo via `expo-font` + the same font files (or `@expo-google-fonts` packages if those exact families are available there).
- **Colors**: defined in OKLCH in `apps/web/src/globals.css` (`@theme` block). Key values (dark, since that's the only mode that ships):
  - `background: oklch(0.145 0 0)` (~#0a0a0a), `foreground: oklch(0.985 0 0)`
  - `card: oklch(0.205 0 0)`, `primary: oklch(0.922 0 0)`, `primary-foreground: oklch(0.205 0 0)`
  - `muted: oklch(0.269 0 0)` / `muted-foreground: oklch(0.708 0 0)`
  - `destructive: oklch(0.704 0.191 22.216)` (red), `border: oklch(1 0 0 / 10%)` (white @10%)
  - Pull the full light+dark table from `apps/web/src/globals.css` directly when setting up NativeWind theme tokens — don't re-derive by eye.
- **Radius scale**: base `0.625rem` (10px), with `sm/md/lg/xl/2xl/3xl/4xl` as multiples of that base — see `globals.css` for the exact `calc()` factors.
- **No shadow/elevation system** — borders do the structural work instead (`border-t`, `ring-1 ring-foreground/10`), not drop shadows. Keep that convention on mobile rather than reaching for native elevation/shadow styles by default.
- **Layout**: web is letterboxed to `max-w-[430px]` to simulate a phone on desktop — irrelevant on RN, where the full screen already is the viewport. There is almost no responsive breakpoint logic anywhere in the feature code (14 total `sm:`/`md:` uses, nearly all inside shadcn's own dialog/drawer components) — the web app was already designed for exactly one screen size, which makes the port easier, not harder.

### Component inventory to replicate (not reuse directly — RN has no DOM)

- shadcn/Base UI primitives in use: button, card, dialog, alert-dialog, drawer, dropdown-menu, popover, collapsible, command, field, input, input-group, label, progress, separator, textarea, toast, chart (Recharts wrapper).
- Hand-rolled, no-library custom pieces worth copying the *logic* of rather than the library: the weight sparkline (`features/measurements/weight-sparkline.tsx`, plain SVG polyline, no Recharts), the habit heatmap (`features/status/heatmap.tsx`, CSS grid of opacity-graded cells), and `progress-ring.tsx` (raw SVG circle with stroke-dasharray). RN equivalents: `react-native-svg` can reproduce all three directly — no charting library needed for these specific views. Recharts itself (used by shadcn's `chart.tsx`) has no RN port; if a future screen needs it for real, look at `victory-native` or `react-native-gifted-charts` instead.
- Icons: `lucide-react` → use `lucide-react-native` (same icon set, same names).

## Data layer — replicate the Client Seam pattern

Web's `apps/web/src/data/client.ts` is the single import boundary every feature hook goes through (never import `api-client`/`demo-client`/`guest-client` directly from feature code — see `CONTEXT.md`'s "Client Seam" entry). Port this pattern as-is:

- `data/api-client.ts` — real fetch calls, one function per endpoint, zod-parsed responses.
- `data/http.ts` — shared `parseOrThrow(response)` + `ApiError` class. Reuse the same error-mapping logic; swap the web-only `window.location.assign("/login")` 401-handler for a navigation call / auth-state reset.
- `data/client.ts` — the seam feature hooks import from.
- Feature hooks (`features/<domain>/use-*.ts`) stay thin `useQuery`/`useMutation` wrappers with zero logic — `@tanstack/react-query` works unmodified in React Native, so this layer ports almost verbatim.
- Guest Mode / Demo Mode: optional to port on day one. If skipped initially, the mobile app can start "Personal Mode only" (every domain hits the real API, no demo fallback) and add guest/demo later — flag this as a decision point rather than assuming parity here.

## API reference (`apps/api`, Go, same backend for both clients)

All routes are under `/api/*`, JSON in/out. Full endpoint list by domain:

- **Auth**: `POST /api/login`, `POST /api/logout`, `GET /api/session`
- **Health**: `GET /api/health`
- **Measurements**: `GET/POST /api/measurements`, `PATCH/DELETE /api/measurements/{id}`
- **Habits**: `GET/POST /api/habits`, `PATCH /api/habits/{id}`, `POST /api/habits/reorder`, `GET/POST /api/habits/entries`, `DELETE /api/habits/entries/{id}`
- **Nutrition**: `GET/POST /api/foods`, `PATCH/DELETE /api/foods/{id}`, `GET/POST /api/food-entries`, `PATCH/DELETE /api/food-entries/{id}`
- **Configuration** (singleton): `GET/PATCH /api/configuration`
- **Training**: exercises, templates, sessions, session-exercises, sets — see `apps/api/internal/training/handlers.go` for the full ~25-route list (session lifecycle: create → log exercises/sets → finish; templates can be saved from a session or edited directly).

Request/response shapes, enums (`mealSlot`, exercise `type`, `workoutType`, `setType`), and the uniform `{"errors": {...}}` error shape are documented in each domain's `convert.go` / `validate.go` under `apps/api/internal/<domain>/` — read those directly rather than re-deriving from the web client's zod schemas, which are a step removed from the source of truth.

Status codes to handle explicitly: `204` means "success, no body" (DELETE, logout, and `GET /api/training/sessions/unfinished` when there's nothing to resume) — don't blindly `JSON.parse` every 2xx response.

### ⚠️ Auth gap — needs a decision before mobile networking is built

The web client relies entirely on the browser's automatic cookie jar: `POST /api/login` sets an HttpOnly session cookie, and every subsequent `fetch` just works because the browser attaches it. **React Native's `fetch` has no cookie jar** — there is no automatic equivalent.

The API also supports a `Authorization: Bearer <token>` path (`apps/api/internal/auth/middleware.go`, backed by a `tokens` table with `read_only`/`read_write` scopes) — the natural fit for a native client — **but no HTTP endpoint exists to mint a token today**. `CreateToken` is only ever called from a Go test.

Pick one before building the mobile data layer (this is the first real decision, not a style question):
1. Add a `POST /api/tokens` (or similar) endpoint, gate it behind the existing password login, and have the mobile app store the issued bearer token (e.g. `expo-secure-store`) — cleanest long-term, requires a small API change.
2. Reuse the password-login flow and have the mobile app manually capture the `Set-Cookie` header from the login response and re-attach it as a plain `Cookie` header on every request — no API change, but cookie parsing/storage is manual plumbing RN doesn't give you for free.

### Base URL

Web hardcodes relative paths (`/api/measurements`) because it's always same-origin (Vercel rewrites `/api/*` to the API service; local dev proxies via Vite). Mobile has no "current origin" — it needs its own config, e.g. `EXPO_PUBLIC_API_URL` (Expo's convention for client-exposed env vars), prefixed onto every request.

CORS: the API sends no CORS headers at all today (same-origin-only deployment). This doesn't block a bare RN app (native `fetch` isn't subject to browser CORS) but would block an **Expo Web** build — flag if web-target Expo output is ever wanted.

## What NOT to port

PWA-specific things with no RN equivalent — skip entirely, Expo has its own mechanisms for the same concerns:
- `vite-plugin-pwa` manifest/service-worker setup, `pwa-assets.config.ts` icon generation, `apps/web/public/*` PWA icons.
- The `max-w-[430px]` "phone frame on desktop" shell styling.
- Any `isOffline`/service-worker-cache-aware branching in the web client — Expo's own offline/update story (`expo-updates`) replaces this.

## Open decisions for whoever picks this up

1. Auth strategy (see flagged gap above) — bearer token endpoint vs. manual cookie handling.
2. Styling approach: NativeWind vs. a component library (e.g. `gluestack-ui`, `react-native-paper`) vs. plain `StyleSheet` — NativeWind is the closest analog to what web already does and is the suggested default, but not mandated here.
3. Whether to port Guest/Demo Mode on day one or start Personal-Mode-only.
4. Monorepo placement: presumably a new `apps/mobile/` alongside `apps/web` and `apps/api` (matching the existing `pnpm-workspace.yaml` structure), but this hand-off doc intentionally does not scaffold it — that's part of the work being handed off.
