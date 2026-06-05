# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**pdf2course** transforms instructional PDFs into gamified Duolingo-style courses using Google Gemini 2.5 Flash. Users create courses by uploading PDFs; the AI pipeline generates structured modules/lessons/exercises.

**Tech Stack:** Nuxt 4, TypeScript (strict), Tailwind CSS, PostgreSQL + Drizzle ORM, better-auth, MinIO (S3), Zod, Google Gemini API, pnpm, BullMQ.

## Commands

```bash
pnpm dev         # Start dev server
pnpm build       # Build for production
pnpm preview     # Preview production build
pnpm db:generate # Generate Drizzle migration from schema changes
pnpm db:migrate  # Apply pending migrations
pnpm test        # Run Vitest (configured)
```

Infrastructure (Postgres, Redis, MinIO) via `docker compose up -d postgres redis minio`.
Migrations auto-run on app start in production via the `migrate` server plugin.

## Architecture

The project uses **Nuxt 4's `app/` + `server/` directory split**. Always follow `docs/style-guide.md` — it is the source of truth for conventions.

### Backend Layering (`server/`)

Strict separation of concerns — never skip layers:

1. **API Handlers** (`server/api/`) — Thin controllers: authenticate → authorize → validate → call service → return. File naming: `[name].[method].ts`.
2. **Service Layer** (`server/services/[domain]/`) — All business logic and external integrations (Gemini, Storage).
3. **Repository Layer** (`server/repositories/`) — Pure Drizzle queries, no business logic. Named `[entity]Repo.ts`.
4. **Auth** (`server/auth/`) — `requireUser(event)` returns better-auth session user; `requireRole(...)` for RBAC. Auth instance at `server/lib/auth.ts`.
5. **DB** (`server/db/`) — Drizzle client (`index.ts`) and full schema (`schema.ts`). Never import raw `postgres` client — always use `db` from `server/db`.
6. **Storage** (`server/storage/`) — Upload/delete/signed URL wrappers over MinIO. Shared S3 client at `server/lib/storage.ts`.
7. **Validators** (`server/validators/`) — Zod schemas for all non-trivial API inputs.

**Rule:** Never put DB queries in API handlers. Never put business logic in repositories. Always use types from `types/`.

### Frontend (`app/`)

- **Pages** (`app/pages/`) — File-based routing. Auth pages at `/auth/`, dashboard at `/dashboard/`, admin at `/admin/`.
- **UI Components** (`app/components/ui/`) — Atomic, "dumb" components prefixed with `Ui` (e.g., `UiButton.vue`).
- **Domain Components** (`app/components/[domain]/`) — Feature-specific components.
- **Composables** (`app/composables/`) — Shared state via `useState`. `useProfile.ts` manages global user profile.
- **Middleware** (`app/middleware/`) — `auth.ts` (login redirect), `role.ts` (admin-only routes).

### Shared Types (`types/`)

`types/course.ts` defines `Course`, `CoursePdf`, `CourseStatus`, `CourseConfig`, and signed-URL variants. `types/profile.ts` defines `Profile`. `types/courseConfig.ts` defines generation config. Always use shared types — never redefine inline.

### Database

PostgreSQL (pgvector) + Drizzle ORM. Schema in `server/db/schema.ts`. Migrations in `drizzle/migrations/` — generate via `pnpm db:generate`, apply via `pnpm db:migrate`. All schema changes must go through a migration.

Key tables:
- `users` / `sessions` / `accounts` / `verifications` — managed by better-auth
- `profiles` — app profile extending `users`; `role`: 'user' | 'admin'
- `courses` — `status`: draft → pending_review → approved/rejected; `generationStatus`: idle → processing → ready
- `course_pdfs` — uploaded PDFs; stores `extractedText` and `aiSummary`
- `document_chunks` — chunked text with pgvector embeddings for RAG
- `modules` / `lessons` — generated course structure; lessons have `status`: not_generated → generated
- `lesson_completions` — user progress per lesson

Storage via MinIO (S3-compatible). Buckets: `course-covers`, `course-pdfs`, `avatars`. All objects private — always use presigned URLs (1hr expiry). Buckets auto-created on startup via `ensureBuckets` plugin.

### Naming Conventions

- Server files: `camelCase.ts`
- Vue components: `PascalCase.vue`
- DB tables/columns: `snake_case`
- API routes: `[name].[method].ts`

# Project Requirements

## Quick Context (Always Read First)

At the start of every task, read `docs/prd.md` to understand the project's goals, scope, stack, and global constraints.

## Rules

- Never assume requirements — always ground your decisions in the PRD
- If a request conflicts with the PRD, flag it before proceeding
