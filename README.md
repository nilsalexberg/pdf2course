# pdf2course - AI Course Generator

**pdf2course** is a Duolingo-style platform that automatically transforms static PDFs into gamified, interactive learning experiences using Google Gemini and Nuxt.

---

## Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com/) (`app/` + `server/` pattern)
- **Language**: TypeScript (Strict Mode)
- **Package Manager**: [pnpm](https://pnpm.io/)
- **Backend / API**: Nuxt Server Routes (Nitro) + [H3](https://h3.unjs.io/)
- **Auth**: [better-auth](https://www.better-auth.com/) (email/password)
- **Database**: PostgreSQL (pgvector) + [Drizzle ORM](https://orm.drizzle.team/)
- **Storage**: [MinIO](https://min.io/) (S3-compatible, self-hosted)
- **AI**: Google Gemini API (`gemini-2.5-flash`)
- **Job Queue**: [BullMQ](https://docs.bullmq.io/) + Redis
- **Styling**: Tailwind CSS

---

## Features

- **Automated Course Creation**: Upload up to 5 PDFs and let AI generate modules, lessons, and content.
- **RAG-Powered Lessons**: Semantic search via pgvector embeddings retrieves context from PDFs during lesson generation.
- **Gamified Experience**: Vertical course maps and XP-based progression.
- **Interactive Exercises**: AI-generated quizzes — multiple choice, true/false, fill in the blanks, ordering.
- **Course Lifecycle**: Private by default, admin-driven review for public publication.
- **Lazy Content Generation**: Lessons generated on-demand, cached after first run.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Docker](https://www.docker.com/) + Docker Compose
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

---

## Setup Guide

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd pdf2course
pnpm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Key variables:

- `DATABASE_URL`: PostgreSQL connection string (e.g., `postgres://postgres:password@localhost:5432/pdf2course`).
- `BETTER_AUTH_SECRET`: Random secret for session signing.
- `BETTER_AUTH_URL`: Base URL of the app (e.g., `http://localhost:3000`).
- `REDIS_URL`: BullMQ connection string (e.g., `redis://localhost:6379`).
- `MINIO_ENDPOINT`: MinIO server URL (e.g., `http://localhost:9000`).
- `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`: MinIO credentials.
- `GEMINI_API_KEY`: Google AI Studio key.
- `SITE_URL`: Set to `http://localhost:3000` for development.

### 3. Start Infrastructure

Start PostgreSQL, Redis, and MinIO via Docker Compose:

```bash
docker compose up -d postgres redis minio
```

### 4. Run Migrations

```bash
pnpm db:migrate
```

Buckets are created automatically on first app start via the `ensureBuckets` server plugin.

### 5. Run the App

```bash
pnpm dev
```

App starts at `http://localhost:3000`. The BullMQ worker starts automatically as a Nitro plugin.

---

## Production Deployment

Run the full stack (app + postgres + redis + minio):

```bash
docker compose up -d
```

The `app` service runs `pnpm db:migrate` automatically before starting via the `migrate` server plugin.

---

## Architecture

Layered architecture within `server/`:

- **API Handlers**: Thin controllers — auth → validate → call service → return.
- **Service Layer**: Business logic and external integrations (Gemini, Storage).
- **Repository Layer**: Pure Drizzle queries, no business logic.
- **Workers**: Async processing via BullMQ.
- **`server/db/`**: Drizzle client (`index.ts`) and schema (`schema.ts`).
- **`server/lib/`**: Shared infrastructure — `auth.ts` (better-auth instance), `storage.ts` (MinIO/S3 client).

Refer to [docs/style-guide.md](./docs/style-guide.md) for detailed coding standards.
