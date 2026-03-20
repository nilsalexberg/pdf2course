# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**pdf2course** transforms instructional PDFs into gamified Duolingo-style courses using Google Gemini 2.5 Flash. Users create courses by uploading PDFs; the AI pipeline generates structured modules/lessons/exercises.

**Tech Stack:** Nuxt 4, TypeScript (strict), Tailwind CSS, Supabase (DB/Auth/Storage), Zod, Google Gemini API, pnpm.

## Commands

```bash
pnpm dev         # Start dev server
pnpm build       # Build for production
pnpm preview     # Preview production build
```

No test runner is configured. Run migrations via the Supabase dashboard or CLI.

## Architecture

The project uses **Nuxt 4's `app/` + `server/` directory split**. Always follow STYLE_GUIDE.md — it is the source of truth for conventions.

### Backend Layering (`server/`)

Strict separation of concerns — never skip layers:

1. **API Handlers** (`server/api/`) — Thin controllers: authenticate → authorize → validate → call service → return. File naming: `[name].[method].ts`.
2. **Service Layer** (`server/services/[domain]/`) — All business logic and external integrations (Gemini, Storage).
3. **Repository Layer** (`server/repositories/`) — Pure Supabase queries, no business logic. Named `[entity]Repo.ts`.
4. **Auth** (`server/auth/`) — `requireUser(event)` for auth checks, `requireRole(event, client, userId, isAdmin)` for RBAC.
5. **Storage** (`server/storage/`) — File upload/delete/signed URL generation for course covers and PDFs.
6. **Validators** (`server/validators/`) — Zod schemas for all non-trivial API inputs.

**Rule:** Never put DB queries in API handlers. Never put business logic in repositories. Always use types from `types/`.

### Frontend (`app/`)

- **Pages** (`app/pages/`) — File-based routing. Auth pages at `/auth/`, dashboard at `/dashboard/`, admin at `/admin/`.
- **UI Components** (`app/components/ui/`) — Atomic, "dumb" components prefixed with `Ui` (e.g., `UiButton.vue`).
- **Domain Components** (`app/components/[domain]/`) — Feature-specific components.
- **Composables** (`app/composables/`) — Shared state via `useState`. `useProfile.ts` manages global user profile.
- **Middleware** (`app/middleware/`) — `auth.ts` (login redirect), `role.ts` (admin-only routes).

### Shared Types (`types/`)

`types/course.ts` defines `Course`, `CoursePdf`, `CourseStatus`, `CourseConfig`, and signed-URL variants. Always use these shared types — never redefine inline.

### Database

Supabase with RLS enabled on all tables. Migrations in `supabase/migrations/` (numbered `000N_name.sql`). All new DB changes must go through a migration file.

Key tables: `profiles` (extends auth.users, has `role`: 'user'|'admin'), `courses` (with `status`: draft→pending_review→approved/rejected), `course_pdfs`.

Storage buckets: `course-covers` (5MB max, jpeg/png/webp) and `course-pdfs` (50MB max, 5 files per course). Both private — always use signed URLs (1hr expiry).

### Naming Conventions

- Server files: `camelCase.ts`
- Vue components: `PascalCase.vue`
- DB tables/columns: `snake_case`
- API routes: `[name].[method].ts`
