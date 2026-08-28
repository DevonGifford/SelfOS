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
    <!-- <h3> -->
    <!--   <span> -->
    <!--       Demo Application (coming soon) -->
    <!--   </span> -->
    <!-- </h3> -->
</div>

<br/>
<br/>


> [!WARNING]
> **Work in progress.** SelfOS is under active development, and the architecture, API surface, and feature set are still evolving.

### About This Project 🚀

---

SelfOS is a personal data system for tracking the numbers behind your life — training, nutrition, habits, measurements, and eventually health data from the devices you already use.  The goal is simple: collect your own data, build a history of yourself, and keep that data under your control. SelfOS is designed around a shared Go API and PostgreSQL backend, with multiple clients able to read from and contribute to the same personal record over time.

Use [`QUICKSTART.md`](./docs/QUICKSTART.md) to get the project running locally, or see [`CONTEXT.md`](./CONTEXT.md) for architecture, conventions, and development notes.



<br/>
<br/>

### High-Level Architecture

---
SelfOS is designed around a single backend API shared by multiple clients. The Web, Mobile, and TRMNL clients all communicate with the Go API over HTTP, while the API owns validation, business logic, authentication and persistence. Frontends never talk directly to Postgres. This is the target architecture for the project.

```text
┌────────────┐
│    Web     │────┐
└────────────┘    │
                  │
┌────────────┐    │      ┌────────────┐
│   Mobile   │────┼─────▶│   Go API   │
└────────────┘    │      └──────┬─────┘
                  │             │                          ┌─────────────────────────────┐
┌────────────┐    │             ├────── Production ──────▶ │ Neon / Self-hosted Postgres │
│   TRMNL    │────┘             │                          └─────────────────────────────┘
└────────────┘                  │
                                │                          ┌─────────────────────────────┐
                                └────── Development ──────▶│   Local Postgres / Docker   │
                                                           └─────────────────────────────┘
```
                                                           


#### Repository Structure

The repository is intended to grow into a small multi-client monorepo, with deployable applications under apps/, reusable frontend code under packages/, and database concerns kept separately under database/.  The structure below represents the intended direction of the project;

```text
SelfOS/
├── apps/
│   ├── web/              # React / Vite PWA ~ Web client
│   ├── mobile/           # Expo / React-native ~ Mobile client
│   ├── trmnl/            # E-ink / Custom plugin ~ TRMNL client
│   └── api/              # Go / PostgreSQL ~ Backend API
│
├── packages/
│   ├── design-system/
│   ├── api-client/
│   └── schemas/
│
├── database/
│   ├── migrations/
│   └── queries/
│
├── docs/
├── compose.yaml
├── sqlc.yaml
├── mise.toml
├── pnpm-workspace.yaml
└── package.json
```

<br/>
<br/>

### Technology Stack

---

#### [Web Client - Frontend](./apps/web)

The frontend web client lives in `apps/web` and is built with React, TypeScript, and Vite. It is intentionally mobile-first: the mobile layout is the product, while desktop simply provides more space around the same narrow application shell.

#### [Go API - Backend](./apps/api)

The backend lives in `apps/api` and is built with Go's standard `net/http`, `sqlc`, and `goose`. It provides the central API shared by SelfOS clients and owns the application's validation, business logic, authentication, and persistence.

#### [PostgreSQL - Database](./database)

The database layer lives in `database` and is built around plain PostgreSQL. Local development runs PostgreSQL through Docker Compose, while hosted production uses [Neon](https://neon.com). The same schema, migrations, and queries are used in both environments.

----

> [!TIP]
> **Local development**
>
> SelfOS uses [Docker Compose](./compose.yaml) to spin up the web client, Go API, and local PostgreSQL database together with a single command. See [`QUICKSTART.md`](./docs/QUICKSTART.md) for the full setup; each application also documents how to run it independently when needed.


<br/>
<br/>
