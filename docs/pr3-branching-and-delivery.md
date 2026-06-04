# PR 3 — Branching & Delivery

Summary of the decisions and work behind the branching model, CI, and staging deployment, for [tickets 06–08](../.scratch/pwa-release/issues/). Full grilling transcripts and rationale live there; this is the durable record of what was decided and what shipped.

## Ticket 06 — API host: Vercel

The research (`.scratch/pwa-release/research/api-host.md`) recommended Fly.io as primary: ~$2/month always-on, same-origin, a `release_command` hook for migrations. Vercel was the documented runner-up, held back by one real unknown — Vercel's Fluid compute doesn't list Go as a supported runtime, so it was undocumented whether a `pgxpool` would survive between invocations, or whether every request would cold-open a fresh Postgres connection.

**Decision: Vercel**, chosen against the primary recommendation. Because the blocking risk was flagged rather than resolved, it was de-risked with a live spike rather than accepted as an open question: a throwaway Go server (mirroring `apps/api/cmd/api/main.go`'s exact `pgxpool.New()` call) was deployed to a scratch Vercel project backed by a throwaway Neon branch, then hit at increasing intervals.

| Checkpoint | Instance ID | Process uptime | Pool total conns | New conns opened | Ping |
|---|---|---|---|---|---|
| Immediate | `d736a6ed…` | 8s | 1 | 1 | 666ms (cold) |
| +3s | same | 19s | 1 | 1 (reused) | 183ms |
| +1min | same | 105s | 1 | 1 (reused) | 184ms |
| +10min | same | 647s | 1 | 2 (+1 cycled) | 1390ms |

The same process never restarted across the full ~11-minute test; the pool survived intact. One physical connection cycled around the 10-minute mark — pgx's own designed self-healing (it pings idle connections and replaces dead ones), almost certainly Neon's compute suspending underneath, not a Go-instance cold start. This refuted the flagged risk. Both throwaway resources were torn down after.

## Ticket 07 — Branching model and CI

**The reframe:** Vercel deploys automatically on push via its native GitHub integration — no GitHub Actions workflow code needed for the deploy itself. CI in this repo is therefore verification-only, never a deployment orchestrator.

Also verified before deciding anything: `git tag -l` returned nothing, so `Release/v0.0.0`/`Release/v0.0.1` were never actual tagged releases, just a branch-naming habit with no PR-based workflow behind it anywhere in the repo's history.

**Decisions:**

- **Branches:** `main` = production, `staging` = a long-lived branch (required — Vercel needs a persistent branch to assign a stable domain). Feature branches cut from and merge into `staging`; `staging` → `main` is a deliberate PR, never automatic. `Release/*` retired by renaming `Release/v0.0.1` to `staging` in place (not merging to `main` first, which would have shipped pre-cutover work early).
- **CI scope:** runs exactly what `lefthook.yml` already runs locally (`pnpm lint`/`build`/`test`, `go vet`/`build`/`test`) as required PR checks into `staging` and `main`. Real test suites arrive in PR 5; CI picks them up automatically since it invokes the same commands.
- **lefthook:** unchanged. Stays as fast local defense-in-depth even with CI in place — it catches problems ~30–60s before a GitHub Actions run would report back.
- **DB-backed Go tests:** CI provisions a real `postgres:16-alpine` service container so they run instead of silently `t.Skip`-ing without `DATABASE_URL` — closing a trap QUICKSTART itself warns about.
- **Migrations:** `goose` runs as an explicit CI step on push to each branch, not a manual gate — cheap to wire now, removes a step that could be forgotten under real deploy pressure.
- **Promotion:** a deliberate `staging` → `main` PR, gated by the same CI checks. Not automatic, not tag-triggered.

## Ticket 08 — Delivery pipeline, built and verified live

Executed tickets 06 and 07 against real infrastructure — not a dry run.

**Branch:** `Release/v0.0.1` renamed to `staging` (verified in sync with its remote first), old remote branch deleted. `main` confirmed as Vercel's production branch.

**Staging database:** a real, separate Neon branch (`staging`, off the actual `selfos` project) — asked and decided explicitly here, since ticket 13 (production cutover) hadn't yet settled shared-vs-separate and ticket 08 needed an answer to wire up the migration secret.

**CI/CD:**
- `.github/workflows/ci.yml` — the verification gate from ticket 07.
- `.github/workflows/migrate.yml` — runs `goose` on push to `staging`/`main`, scoped to a GitHub Environment per branch. `DATABASE_URL_UNPOOLED` (Neon's direct endpoint, required for migrations) set as the `staging` environment's secret. The `production` environment is deliberately left unconfigured — no database has been designated production yet; that's still ticket 13's call.
- `vercel.json` at the repo root declares `web` and `api` as one Vercel Services deployment, `/api/*` routed to the Go service and everything else to web. A real Vercel project (`selfos`) was created and connected to the GitHub repo via native integration — pushes to `staging` deploy automatically, confirmed by watching a real push trigger a real build.

**Three real bugs found by the live deploy, not by review:**

1. Root `package.json`'s `"prepare": "lefthook install"` aborted `pnpm install` entirely in Vercel's build sandbox, which isn't a git checkout (`fatal: not a git repository`). Fixed with `lefthook install || true` — real local installs are unaffected.
2. `apps/api/cmd/api/main.go`'s `/health` route lacked the `/api` prefix every other route has, so it 404'd under both Vercel's Services rewrite and `apps/web`'s dev proxy (neither strips the prefix). Moved to `/api/health`.
3. A per-service SPA-fallback rewrite (so client-side routes like `/measurements` survive a direct load or refresh) does nothing as a nested `vercel.json` inside the service's own directory. Per Vercel's Services routing docs, it has to live under `services.web.rewrites` in the root `vercel.json`.

Also added `PORT` env var support to `main.go` (Vercel's required listen convention), additive to the existing `API_ADDR` so `compose.yaml` behavior is unchanged.

**Verified against the live deployment:**

- `https://selfos-git-staging-devongiffords-projects.vercel.app` (Vercel's stable git-branch alias) — web, `/api/health`, and `/api/measurements` all confirmed reachable.
- Deep link `/measurements` loads directly (SPA fallback fix confirmed).
- A real add → toast → undo round-trip against the actual staging Neon branch, verified in a browser exactly like ticket 05's local verification — this time against the hosted stack.
- Service worker registers and reaches `activated` state, manifest serves all 4 icons, on this app's first-ever real HTTPS origin.
- Vercel's default SSO/deployment protection was toggled off for this verification window (a single project-level API call, no redeploy needed) and back on immediately after.

**Outstanding:** the actual real-phone install-and-run-standalone check. Everything upstream of it is verified; only the physical device step remains.
