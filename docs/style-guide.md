# Style Guide — pdf2course

## Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com/) (`app/` + `server/` directories)
- **Language**: TypeScript (Strict Mode)
- **Package Manager**: [pnpm](https://pnpm.io/)
- **Backend / API**: Nuxt Server Routes (Nitro) + [H3](https://h3.unjs.io/)
- **Auth**: [better-auth](https://www.better-auth.com/) (email/password; instance at `server/lib/auth.ts`)
- **Database**: PostgreSQL (pgvector) + [Drizzle ORM](https://orm.drizzle.team/) (schema at `server/db/schema.ts`)
- **Storage**: [MinIO](https://min.io/) (S3-compatible; client at `server/lib/storage.ts`)
- **AI**: Google Gemini API (`gemini-2.5-flash`)
- **Job Queue**: [BullMQ](https://docs.bullmq.io/) + Redis
- **Styling**: Tailwind CSS
- **Validation**: [Zod](https://zod.dev/)

---

## Folder Structure

```text
/
├── app/                    # Frontend (Nuxt 4 App Layer)
│   ├── assets/             # Global styles and static assets
│   ├── components/
│   │   ├── ui/             # Atomic UI components (prefixed `Ui`)
│   │   └── [domain]/       # Feature-specific components
│   ├── composables/        # Shared state and logic (Vue Composition API)
│   ├── middleware/         # Route guards (auth, role-based)
│   ├── pages/              # File-based routing
│   └── app.vue
├── server/                 # Backend (Nuxt Server Layer)
│   ├── api/                # API endpoint handlers (H3 event handlers)
│   ├── auth/               # Auth helpers (requireUser, requireRole)
│   ├── db/                 # Drizzle client (index.ts) and schema (schema.ts)
│   ├── http/               # Low-level HTTP utilities (multipart parsing, etc.)
│   ├── lib/                # Shared infrastructure (auth.ts, storage.ts)
│   ├── plugins/            # Nitro plugins (worker boot, ensureBuckets, migrate)
│   ├── queues/             # BullMQ queue definitions
│   ├── repositories/       # Data access layer (Drizzle queries)
│   ├── services/           # Business logic and external integrations
│   ├── storage/            # File upload/delete/presign wrappers (per bucket)
│   ├── utils/              # Shared server utilities
│   ├── validators/         # Zod schemas for API inputs
│   └── workers/            # BullMQ worker implementations
├── types/                  # Shared TypeScript types
├── docs/                   # Project documentation
├── drizzle/                # Generated Drizzle migrations
│   └── migrations/
└── drizzle.config.ts
```

---

## Backend Architecture (`server/`)

Strict layered architecture — never skip layers.

### 1. API Handlers (`server/api/`)

Thin controllers only. Responsibilities in order:

1. Authenticate — `requireUser(event)`
2. Authorize — `requireRole(...)` if needed
3. Validate — read body/params, run Zod schema
4. Call service — pass validated data
5. Return result

No DB queries. No business logic. No direct Drizzle imports.

### 2. Service Layer (`server/services/[domain]/`)

All business logic lives here. Services:

- Orchestrate repositories and external calls
- Handle Gemini API, storage operations
- Are single-purpose files (e.g., `createCourse.ts`, `generateLessonContent.ts`)

### 3. Repository Layer (`server/repositories/`)

Pure data access — Drizzle queries only. Repositories:

- Import `db` from `server/db` and tables from `server/db/schema`
- Return typed results, no business logic
- Wrap DB errors in H3 errors when appropriate
- Named `[entity]Repo.ts`

### 4. Auth & Security (`server/auth/`)

- `requireUser(event)` — validates better-auth session, returns user. Throws 401 if missing.
- `requireRole(event, userId, isAdmin)` — enforces RBAC. Throws 403 if insufficient role.
- Auth instance lives at `server/lib/auth.ts` — never instantiate it elsewhere.

### 5. DB (`server/db/`)

- `index.ts` — Drizzle client singleton; always import `db` from here
- `schema.ts` — all table definitions; import table refs from here in repositories
- Never use raw `postgres` client directly outside of `server/db/index.ts`

### 6. Storage (`server/storage/`)

- One file per bucket: `courseCovers.ts`, `coursePdfs.ts`, `avatars.ts`
- All use helpers from `server/lib/storage.ts` (S3/MinIO client)
- Always return presigned URLs — never expose raw object paths to the client

---

## Frontend Architecture (`app/`)

### Components

- Use **Vue 3 Composition API** with `<script setup lang="ts">`
- **UI Components** (`app/components/ui/`) — "dumb" components, prefixed `Ui` (e.g., `UiButton.vue`)
- **Domain Components** (`app/components/[domain]/`) — feature-specific, not prefixed

### Composables

- `app/composables/` for reusable logic or shared state via `useState`
- `useProfile.ts` manages current user's profile globally

---

## Coding Standards

### Naming Conventions

| Thing | Convention |
|---|---|
| Server files | `camelCase.ts` |
| Vue components | `PascalCase.vue` |
| Repositories | `[entity]Repo.ts` |
| API routes | `[name].[method].ts` |
| DB tables/columns | `snake_case` |
| Types | `PascalCase` in `types/` |

### Logic Separation Rules

- **NEVER** put DB queries in API handlers
- **NEVER** put business logic in repositories
- **ALWAYS** use types from `types/` — never redefine inline
- **ALWAYS** validate non-trivial API inputs with Zod schemas in `server/validators/`

---

## Database & Migrations

- Schema defined in `server/db/schema.ts` using Drizzle table builders
- Generate migration: `pnpm db:generate`
- Apply migration: `pnpm db:migrate`
- All schema changes must go through a migration file in `drizzle/migrations/`
- Use `snake_case` for all table names and column names
- Migrations auto-run on production startup via the `migrate` Nitro plugin
