## Getting started

Tooling (Node, pnpm, Go, `sqlc`, `goose`) is managed by [mise](https://mise.jdx.dev) — `mise install` from the repo root picks up everything in `mise.toml`.

```bash
cp .env.example .env
docker compose up
```

1. `cp .env.example .env` — `.env` is git-ignored and not shipped, so this step is required before anything below will connect to a database.
2. `docker compose up` — builds and runs `apps/web` and `apps/api`, each in its own container with hot reload.

`apps/web` is then at `http://localhost:5173`, and `apps/api` at `http://localhost:8080`.

> [!NOTE]
> Local Postgres is mid-migration off Supabase: `compose.yaml` doesn't yet run a database service, so `DATABASE_URL` in `.env` needs a Postgres instance you provide yourself for now. A `postgres` service in `compose.yaml` is coming next, at which point `docker compose up` alone will be a complete local environment.

<br/>
<br/>

## Database

Database changes are managed with `goose`, while `sqlc` generates type-safe Go code from hand-written SQL queries. Run migrations when the schema changes, and run `sqlc generate` after changing migrations or query files.

Apply migrations (needs `DATABASE_URL` exported in your shell first — it's only read from `.env` automatically inside the Go process itself, not by `goose` on the command line):
```bash
set -a; source .env; set +a
goose -dir database/migrations postgres "$DATABASE_URL" up
```

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
