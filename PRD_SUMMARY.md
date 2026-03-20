# PRD — pdf2course (Summary)
## Automatic Duolingo-Style Course Generator from PDFs
 
**Stack:** Nuxt.js · TypeScript · Tailwind CSS · Supabase · Google Gemini 2.5 Flash

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
1. User uploads PDF → stored in private Supabase Storage bucket.
2. Text extracted via `pdf-parse`.
3. Full text sent to `gemini-2.5-flash` in a single call (1M token context — no chunking needed for most documents).
4. Gemini returns structured JSON (modules → lessons → content blocks + exercises) via native Structured Output (`responseMimeType: "application/json"`).
5. Content persisted to database; user notified via Supabase Realtime.

**Security:** RLS enabled on all tables — users only access their own data or explicitly public content. API key server-side only.

---

*Full specification: PRD.md v2.0*