## Getting started

Tooling (Node, pnpm, Go, the Supabase CLI, `sqlc`, `goose`) is managed by [mise](https://mise.jdx.dev) — `mise install` from the repo root picks up everything in `mise.toml`.

Local Postgres, Auth, and Storage run via the Supabase CLI's own stack, **not** through this repo's `compose.yaml` — it manages its own Docker project independently. That means getting a full local environment running is three steps, not one:

```bash
cp .env.example .env
supabase start
docker compose up
```

1. `cp .env.example .env` — `.env` is git-ignored and not shipped, so this step is required before anything below will connect to a database. The example values already work as-is for local dev (every `supabase start` prints the same local `DATABASE_URL` and demo keys) — only edit `.env` if you're pointing at a hosted Supabase project instead.
2. `supabase start` — brings up local Postgres/Auth/Storage. Run it once and leave it running across sessions; use `supabase stop` when you're done with it for a while.
3. `docker compose up` — builds and runs `apps/web` and `apps/api`, each in its own container with hot reload, connecting to the Supabase stack from step 2.

`apps/web` is then at `http://localhost:5173`, and `apps/api` at `http://localhost:8080`.

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

Stop the local Supabase stack:
```bash
supabase stop
```
