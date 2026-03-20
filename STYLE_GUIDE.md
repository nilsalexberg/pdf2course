# Project Style Guide - pdf2course

## Overview
**pdf2course** is a Nuxt 4 application designed to transform instructional PDFs into gamified learning experiences. 

### Tech Stack
- **Framework**: [Nuxt 4](https://nuxt.com/) (using the `app/` and `server/` directory structure).
- **Language**: TypeScript (Strict Mode).
- **Backend / API**: Nuxt Server Routes (Nitro) + [H3](https://h3.unjs.io/).
- **Database / Auth / Storage**: [Supabase](https://supabase.com/).
- **AI**: Google Gemini API (`gemini-2.5-flash`).
- **Styling**: Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/) (Vue port).
- **Validation**: [Zod](https://zod.dev/).

---

## Folder Structure

```text
/
├── app/                  # Frontend (Nuxt 4 App Layer)
│   ├── assets/           # Global styles and static assets
│   ├── components/       # Vue Components
│   │   └── ui/           # Base Atomic UI Components (prefixed with `Ui`)
│   ├── composables/      # Shared state and logic (Vue Composition API)
│   ├── middleware/       # Route protection (auth, role-based)
│   ├── pages/            # View components (file-based routing)
│   └── app.vue           # Main Entry Point
├── server/               # Backend (Nuxt Server Layer)
│   ├── api/              # API Endpoint Handlers (H3 event handlers)
│   ├── auth/             # Auth utilities (server-side security)
│   ├── repositories/     # Data Access Layer (Supabase client calls)
│   ├── services/         # Business Logic Layer (Orchestration)
│   ├── storage/          # File storage logic (Supabase Storage)
│   └── validators/       # Zod schemas for request validation
├── types/                # Shared TypeScript types / Interfaces
├── supabase/             # Database migrations and seed scripts
└── STYLE_GUIDE.md        # This document
```

---

## Backend Architecture (server/)

The backend follows a **Layered Architecture** to ensure separation of concerns and testability.

### 1. API Handlers (`server/api/`)
API handlers are thin. Their responsibilities are:
- Receive the `event`.
- Authenticate the user (`requireUser`).
- Authorize the operation (`requireRole`).
- Extract and validate request data using Zod (`server/validators/`).
- Call the appropriate **Service**.
- Return the result.

### 2. Service Layer (`server/services/`)
This is where the **Business Logic** lives. Services:
- Orchestrate multiple repositories if needed.
- Handle external integrations (e.g., Gemini API, Storage).
- Are organized by domain (e.g., `services/courses/`).

### 3. Repository Layer (`server/repositories/`)
Pure **Data Access Layer**. Repositories:
- Use the Supabase client to interact with the database.
- Should NOT contain business logic.
- Handle errors from the database and wrap them in H3 errors if necessary.

### 4. Auth & Security
- Use `requireUser(event)` to ensure the user is logged in.
- Use `requireRole(event, client, userId, isAdminOnly)` to enforce role-based access.

---

## Frontend Architecture (app/)

### 1. Components
- Use **Vue 3 Composition API** with `<script setup lang="ts">`.
- **UI Components**: Place in `app/components/ui/` and prefix with `Ui` (e.g., `UiButton.vue`). These are "dumb" components focused on styling.
- **Domain Components**: Place in `app/components/[domain]/`.

### 2. Composables
- Use `app/composables/` for reusable logic or shared state (via `useState`).
- Example: `useProfile.ts` manages the current user's profile state globally.

---

## Coding Standards

### Naming Conventions
- **Server-side Files**: `camelCase.ts`.
- **Vue Components**: `PascalCase.vue`.
- **Repositories**: `[entity]Repo.ts`.
- **API Routes**: Nuxt convention `[name].[method].ts` (e.g., `courses.get.ts`).

### Logic Separation
- **NEVER** put database queries directly in API handlers.
- **NEVER** put complex business logic in repositories.
- **ALWAYS** use shared types from the `types/` directory to ensure consistency between frontend and backend.
- **Validation**: Use Zod schemas for all non-trivial API inputs.

---

## Database & Migrations
- All database changes MUST be recorded in `supabase/migrations/`.
- Use snake_case for table names and column names.
- Ensure [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security) is enabled and properly configured for every table.
