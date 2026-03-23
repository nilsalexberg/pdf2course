# PRD — pdf2course (Summary)
## Automatic Duolingo-Style Course Generator from PDFs
 
**Stack:** [pnpm](https://pnpm.io/) · [Nuxt 4](https://nuxt.com/) · TypeScript · Tailwind CSS · Supabase · Google Gemini 2.5 Flash

---

## What is it?

A platform where any user can upload PDFs and automatically generate a Duolingo-style gamified course from them. The same user can create courses and play them — there is no separate "producer" or "student" role. Courses can be kept private or submitted for public publication after admin approval.

---

## Roles

| Role | Description |
|---|---|
| `user` | Default role. Can create courses, play their own courses, and play public courses. |
| `admin` | Can approve/reject courses for public publication and manage users. Also has full user capabilities. |

---

## Course Visibility Lifecycle

- **private:** visible only to the creator. Default on creation.
- **pending_review:** creator submitted for publication. Locked for editing. Visible to admins only.
- **public:** approved by admin. Visible and playable by all users.
- **rejected:** admin denied. Reverts to private with a written reason. Creator can edit and resubmit.

---

## Core Features

### For Every User

**Dashboard (unified home)**
- "My Courses" — courses the user created, with status badges and context actions.
- "Continue Playing" — in-progress courses with a progress bar.
- "Discover" — public courses from other users.
- Persistent streak and XP display.

**Course Creation**
- Create a course with title, description, cover image, and AI settings (number of modules and lessons).
- Upload up to 5 PDFs (max 50 MB each) as source material.
- AI generates the full course structure automatically (modules → lessons → content blocks + exercises).
- Edit, reorder, and regenerate any part of the generated content.
- Submit for public review or keep private.

**Course Discovery**
- Browse and search the public course catalog.
- Start playing any public course instantly.

**Lesson Engine**
- Visual course map (Duolingo-style vertical trail).
- Sequential lesson unlocking.
- Each lesson alternates between content screens and interactive exercises.
- Exercise types: multiple choice, true/false, fill in the blank, ordering.
- Immediate feedback on every answer (green = correct, red = wrong + explanation).
- Lives (hearts) system: 5 per lesson; runs out → 30-minute pause or use a power-up.
- XP and progress saved per session.

**Gamification**
- Global XP earned across all courses.
- Daily streaks.
- Badges: First Lesson, Perfect Week, Flawless, Marathon, Module Master, Course Graduate, Creator.
- Weekly global leaderboard.
- Power-up: "Shield" (protects one wrong answer per lesson).

### For Admins

- Review queue of courses pending public approval.
- Approve (→ public) or reject (→ private + mandatory reason).
- Force any public course back to private.
- Manage users (deactivate, change roles).
- Platform metrics dashboard.

---

## Tech Architecture

**Data model highlights:**
- `profiles` — extends Supabase Auth users with `role` (user | admin).
- `courses` — owned by creator; has `visibility` field driving the entire lifecycle.
- `plays` — created when a user starts a course; tracks all progress. Replaces enrollments.
- `user_stats` — global XP and streak per user, not per course.
- `jobs` — async queue for PDF extraction and AI generation.

**AI Generation Pipeline:**

1. User uploads PDFs → stored in private Supabase Storage bucket.
2. User clicks "Generate Course":
   - Backend creates a `generation_id`
   - Course status set to `processing`
   - Async job is enqueued
3. PDF Processing:
   - Text extracted via `pdf-parse`
   - Text is cleaned (whitespace, artifacts, basic normalization)
4. Chunking:
   - Documents split into chunks (~500–1000 tokens with overlap)
   - Chunks stored in database
5. Embeddings (RAG):
   - Embeddings generated for each chunk
   - Stored for future semantic retrieval (lesson generation phase)
6. Lightweight Semantic Extraction:
   - Keyphrases extracted per chunk (e.g. via KeyBERT or similar)
   - Used to reduce noise and guide summarization
7. Summarization Layer:
   - Chunk-level summaries (optional / optimized)
   - Document-level summaries generated
   - Final course-level summary created:
     - key topics
     - themes
     - estimated difficulty
8. Course Structure Generation:
   - Course status → `generating_structure`
   - Course summary + `generation_settings` sent to `gemini-2.5-flash`
   - Model returns structured JSON:
     - modules
     - lessons (title + objective only)
9. Persistence:
   - Modules and lessons saved to database
   - Lessons created with status `not_generated` (no content yet)
10. Completion:
   - Course status → `ready`
   - User notified via Supabase Realtime

**Important Notes:**

- Lesson content (text, quizzes, etc.) is generated lazily:
  - Triggered when the user starts a lesson
  - Cached after first generation

- Pipeline is idempotent:
  - Safe to retry using `generation_id`
  - Steps skip already-processed data

- Embeddings are reused later for:
  - context retrieval during lesson generation (RAG)

- Generation settings (modules, lessons, difficulty, etc.) are snapshotted at generation time

**Security:** RLS enabled on all tables — users only access their own data or explicitly public content. API key server-side only.
