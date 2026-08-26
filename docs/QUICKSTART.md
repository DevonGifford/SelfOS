## Getting started

Tooling (Node, pnpm, Go, `sqlc`, `goose`) is managed by [mise](https://mise.jdx.dev) — `mise install` from the repo root picks up everything in `mise.toml`.

```bash
cp .env.example .env
docker compose up
```

1. `cp .env.example .env` — `.env` is git-ignored and not shipped, so this step is required before anything below will connect to a database.
2. `docker compose up` — builds and runs `apps/web` and `apps/api`, each in its own container with hot reload.

`apps/web` is then at `http://localhost:5173`, and `apps/api` at `http://localhost:8080`. `docker compose up` also brings up a local Postgres, with migrations still applied separately (see Database below).

<br/>
<br/>

## Database

Database changes are managed with `goose`, while `sqlc` generates type-safe Go code from hand-written SQL queries. Run migrations when the schema changes, and run `sqlc generate` after changing migrations or query files.

Local dev's Postgres runs via `compose.yaml` (started by `docker compose up` above); hosted Postgres is [Neon](https://neon.com). The Go API only ever reads `DATABASE_URL` — same schema, same queries, same binary either way, only the connection string differs.

Apply migrations to local Postgres (needs `DATABASE_URL` exported in your shell first — it's only read from `.env` automatically inside the Go process itself, not by `goose` on the command line):
```bash
set -a; source .env; set +a
goose -dir database/migrations postgres "$DATABASE_URL" up
```

To apply migrations to the hosted Neon database instead, point `goose` at `NEON_DATABASE_URL` (also in `.env`) rather than `DATABASE_URL`:
```bash
set -a; source .env; set +a
goose -dir database/migrations postgres "$NEON_DATABASE_URL" up
```

> [!NOTE]
> A real deployment's own `DATABASE_URL` (wherever `apps/api` actually runs in production) isn't decided yet — `NEON_DATABASE_URL` is just how this repo's local dev reaches the hosted database directly (e.g. to run migrations against it). Whatever hosts `apps/api` in production will set its own `DATABASE_URL`, likely to the same Neon connection string.

Generate Go database code after changing migrations or queries:
```bash
sqlc generate
```


<br/>
<br/>

## Tests

Frontend tests cover the React application and UI behavior, while backend tests cover the Go API and database interactions.

Frontend:
```bash
pnpm --filter web test
```

Backend (needs `DATABASE_URL` exported — see the Database section above; without it the DB-backed tests `t.Skip` rather than fail, which reads as "passed" if you're not watching for it):
```bash
cd apps/api
go test ./...
```

<br/>
<br/>

## Stopping

Stop the SelfOS containers:
```bash
docker compose down
```
