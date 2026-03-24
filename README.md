# pdf2course - AI Course Generator

**pdf2course** is a Duolingo-style platform that automatically transforms static PDFs into gamified, interactive learning experiences using Google Gemini and Nuxt.

---

## 🚀 Tech Stack

- **Framework**: [Nuxt 4](https://nuxt.com/) (using `app/` and `server/` pattern)
- **Language**: TypeScript (Strict Mode)
- **Package Manager**: [pnpm](https://pnpm.io/)
- **Backend / API**: Nuxt Server Routes (Nitro) + [H3](https://h3.unjs.io/)
- **Database / Auth / Storage**: [Supabase](https://supabase.com/)
- **AI**: Google Gemini API (`gemini-2.5-flash`)
- **Job Queue**: [BullMQ](https://docs.bullmq.io/) + Redis
- **Styling**: Tailwind CSS + [shadcn/ui](https://ui.shadcn.com/)

---

## ✨ Features

- **Automated Course Creation**: Upload up to 5 PDFs and let AI generate modules, lessons, and content.
- **RAG-Powered Lessons**: Uses semantic search (embeddings) to retrieve context from your PDFs for lesson generation.
- **Gamified Experience**: Vertical course maps, leveling system (XP), streaks, and lives (hearts).
- **Interactive Exercises**: AI-generated quizzes including multiple choice, true/false, fill in the blanks, and ordering.
- **Course Lifecycle**: Private by default, with an admin-driven review process for public publication.
- **Lazy Content Generation**: Lessons are generated on-demand when a user starts them, then cached for performance.

---

## 🛠 Prerequisites

Before you begin, ensure you have:
- [Node.js](https://nodejs.org/) (latest LTS recommended)
- [pnpm](https://pnpm.io/) installed (`npm install -g pnpm`)
- A [Redis](https://redis.io/) instance running (local or cloud)
- A [Supabase](https://supabase.com/) account and project
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)

---

## 🏗 Setup Guide

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
- `SUPABASE_URL` / `SUPABASE_KEY`: Your project credentials.
- `REDIS_URL`: Connection string for BullMQ (e.g., `redis://localhost:6379`).
- `GEMINI_API_KEY`: Your Google AI Studio key.
- `SITE_URL`: Set to `http://localhost:3000` for development.

### 3. Supabase Configuration
1.  **Migrations**: Run the SQL scripts found in `supabase/migrations/` in your Supabase SQL Editor.
2.  **Storage**: Create two **private** buckets:
    - `course-covers`: For course thumbnail images.
    - `course-pdfs`: For the uploaded source material.
3.  **RLS**: Ensure Row Level Security is enabled. The migrations include initial policies, but double-check them in the dashboard.

### 4. Running the Project
```bash
pnpm dev
```
The application will start at `http://localhost:3000`. The background worker for course generation starts automatically as a Nitro plugin.

---

## 🔑 Google OAuth (Optional)

1.  Enable "Google" under **Authentication > Providers** in the Supabase dashboard.
2.  Configure your OAuth credentials in the [Google Cloud Console](https://console.cloud.google.com/).
3.  Add the redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
4.  Update `SITE_URL` in `.env` if using a production environment.

---

## 📐 Architecture

The project follows a **Layered Architecture** within the `server/` directory:
- **API Handlers**: Thin wrappers for requests/validation.
- **Services**: Business logic and orchestration (Gemini, Storage).
- **Repositories**: Direct data access using Supabase client.
- **Workers**: Asynchronous processing using BullMQ.

Refer to [STYLE_GUIDE.md](./STYLE_GUIDE.md) for detailed coding standards.

