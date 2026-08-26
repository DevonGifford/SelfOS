<!-- Logo -->
<pre align="center">
███████╗███████╗██╗     ███████╗       ██████╗ ███████╗
██╔════╝██╔════╝██║     ██╔════╝      ██╔═══██╗██╔════╝
███████╗█████╗  ██║     █████╗        ██║   ██║███████╗
╚════██║██╔══╝  ██║     ██╔══╝        ██║   ██║╚════██║
███████║███████╗███████╗██║     █████╗╚██████╔╝███████║
╚══════╝╚══════╝╚══════╝╚═╝     ╚════╝ ╚═════╝ ╚══════╝
</pre>

<!-- Introduction Text -->
<div align="center">
    <h2>
       Personal data, owned by you.
    </h2>
      <a href="https://skillicons.dev">
       <img src="https://skillicons.dev/icons?i=react,ts,tailwind,vite,go,postgres,docker,github" />
    </a>
    <h3>
      <span>
          Demo Application (coming soon)
      </span>
    </h3>
</div>

<br/>
<br/>


### About This Project 🚀

---

Track the numbers behind your life. SelfOS gives you a place to collect your own data — training, nutrition, habits, measurements — so you can see patterns, measure progress, and understand what changed, what worked, and perhaps why.

See [`QUICKSTART.md`](./docs/QUICKSTART.md) for setup, [`CONTEXT.md`](./CONTEXT.md) for architecture and conventions, and [`docs/adr/`](./docs/adr/) for the reasoning behind some deliberately unconventional choices (like a Go API in an otherwise all-TypeScript stack).

> [!WARNING]
> **Work in progress.** SelfOS is under active development, and the architecture, API surface, and feature set are still evolving.


<br/>
<br/>

### High-Level Architecture

---
The frontend never talks directly to Postgres. Application data flows through the Go API, which owns validation, business rules, and persistence.

```text
React / Vite
     │
     │ HTTP / JSON
     ▼
   Go API
     │
     │ sqlc / pgx
     ▼
  PostgreSQL
```

#### Repository Structure

```text
SelfOS/
├── apps/
│   ├── web/              # React / Vite frontend
│   └── api/              # Go REST API
├── database/
│   ├── migrations/       # goose migrations
│   └── queries/          # sqlc queries
├── docs/                 # ADRs, quickstart guide
├── compose.yaml
├── sqlc.yaml
├── mise.toml
├── pnpm-workspace.yaml
└── package.json
```

<br/>
<br/>

### Incremental by Design

---

Every domain (Nutrition, Training, Habits, Measurements) starts on in-memory demo data behind a single client seam, and migrates to the real Go API + Postgres one domain at a time — never a big-bang cutover. **Measurements** is the first to go real today; everything else is still demo data, and that's the expected state mid-migration, not a gap.

That seam also means SelfOS can run in two modes from the same codebase: a zero-credential **Demo Mode** (nothing but demo data, nothing to configure — good for a public/portfolio deployment) and a **Personal Mode** where a domain's data is real and persists. See `CONTEXT.md`'s Client Seam / Demo Mode / Personal Mode entries for the full mechanics.

<br/>
<br/>

### Tech Stack Overview

---

#### Vite Web App

The frontend lives in `apps/web` and is built with React, TypeScript, and Vite.

It is intentionally mobile-first: the mobile layout is the product, while desktop simply provides more space around the same narrow application shell.

Data flows through a single client seam (see "Incremental by Design" above) rather than importing demo or API clients directly, so a feature's code never has to know or care which one it's currently backed by.

#### Go API Backend

The backend lives in `apps/api` and exposes a REST API over HTTP. It handles request processing, validation, application and domain logic, database access, and JSON serialization.

The API uses Go’s standard `net/http` package, `pgx/v5` for PostgreSQL access, `sqlc` to generate type-safe Go code from hand-written SQL, and `goose` to manage database migrations. SQL remains explicit, version-controlled, and close to the data model rather than being hidden behind an ORM.

#### PostgreSQL

SelfOS runs on plain PostgreSQL — no managed-platform lock-in. The Go API is the only thing that talks to the database, and it only ever depends on a `DATABASE_URL`; there's no provider-specific code and no environment branching anywhere in the app.

Local dev runs Postgres via Docker Compose; hosted/production Postgres is [Neon](https://neon.com). See [`QUICKSTART.md`](./docs/QUICKSTART.md) for the local setup.

#### Docker Development Environment

Local development uses Docker Compose for the SelfOS web and API services.

The Go API uses Air for hot reload, while Vite handles frontend hot reload.

#### Auth

Not built yet. The plan is simple single-user auth in front of the Go API — a web session cookie plus per-client bearer tokens — needed before any public deployment. Everything above (Postgres, the client seam, Demo/Personal Mode) works without it today.
