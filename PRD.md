# PRD — pdf2course
## Automatic Duolingo-Style Course Generator from PDFs

---

**Version:** 2.0  
**Stack:** Nuxt.js · TypeScript · Tailwind CSS · Supabase · Google Gemini 2.5 Flash

---

## 1. Product Overview

### 1.1 Problem

People with knowledge to share have instructional material in PDF format but lack accessible tools to transform it into engaging learning experiences. At the same time, learners lack a single place to find gamified, bite-sized courses on niche topics. The barrier to course creation is too high, and the barrier to finding quality learning content is too scattered.

### 1.2 Solution

**pdf2course** is a platform where any registered user can:

1. **Create** a course by uploading PDFs — the platform automatically generates a Duolingo-style gamified course from them.
2. **Play** any of their own courses privately.
3. **Publish** their course publicly so other users can play and learn from it.
4. **Discover and play** publicly available courses created by other users.

There are no separate "producer" and "student" roles. Every user is both a potential creator and a learner. The only special role is **admin**, which is responsible for approving courses before they go public.

### 1.3 Business Goals

- Let any user create and publish a course in under 30 minutes.
- Build a self-growing library of gamified public courses.
- Maintain content quality via admin review before public publication.
- Deliver a learning experience with a module completion rate above 70%.

### 1.4 Success Metrics (KPIs)

| Metric | Initial Target |
|---|---|
| Average course creation time | < 30 min |
| Module completion rate | > 70% |
| User NPS | > 40 |
| AI content generation time | < 5 min per module |
| Public courses published per week | Growing week-over-week |

---

## 2. Roles

### 2.1 User (`role: user`)

The default role for every registered account. A user can simultaneously:

- Create courses from PDFs.
- Play their own courses (private or public).
- Play any publicly approved course created by other users.
- Submit their own courses for public review.

There is no distinction between "producer" and "student" — the same person does both.

### 2.2 Admin (`role: admin`)

A privileged role assigned manually (via database seed or admin panel). Admins can:

- Review courses submitted for public publication and approve or reject them.
- Manage all users on the platform.
- Access platform-wide metrics.

Admins can also use the platform as regular users (create and play courses).

---

## 3. Course Visibility Model

Every course has a `visibility` field that controls who can access it:

| Visibility Status | Description |
|---|---|
| `private` | Only the creator can see and play it. Default when a course is created. |
| `pending_review` | The creator has requested public publication. Visible only to the creator and admins. |
| `public` | Approved by admin. Visible and playable by all users on the platform. |
| `rejected` | Admin rejected the publication request. Returned to the creator as `private` with a rejection reason. |

**Rules:**
- A course starts as `private` by default.
- The creator can switch a course from `private` to `pending_review` at any time.
- Once `rejected`, the course reverts to `private` and can be edited and resubmitted.
- A `public` course can be pulled back to `private` by the creator or the admin at any time.
- Only `public` courses appear in the course discovery feed.

---

## 4. Architecture and Tech Stack

### 4.1 Stack

| Layer | Technology |
|---|---|
| Frontend | Nuxt.js 3 + Vue 3 (Composition API) |
| Backend / API | Nuxt.js Server Routes (Nitro) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui (Vue port) |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (email/password + OAuth) |
| File Storage | Supabase Storage |
| AI Content Generation | Google Gemini API — `gemini-2.5-flash` |
| PDF Extraction | pdf-parse or pdf.js (Node) |
| Async Jobs / Queues | Custom queue via `jobs` table + Supabase Edge Functions |

### 4.2 Core Data Model (Supabase / PostgreSQL)

```
profiles             → id (= auth.users.id), role (user|admin), name, avatar_url, created_at

courses              → id, creator_id, title, description, cover_url,
                       visibility (private|pending_review|public|rejected),
                       rejection_reason, config (jsonb: num_modules, lessons_per_module),
                       created_at, updated_at

course_pdfs          → id, course_id, file_url, file_name, processing_status, created_at

modules              → id, course_id, order_index, title

lessons              → id, module_id, order_index, title, content_blocks (jsonb)

exercises            → id, lesson_id, order_index, type, question,
                       options (jsonb), correct_answer, explanation

plays                → id, user_id, course_id, started_at, last_active_at, status (active|completed)

lesson_progress      → id, play_id, lesson_id, completed_at, attempts

exercise_attempts    → id, play_id, exercise_id, answer, is_correct, attempted_at

user_stats           → id (= user_id), xp_total, streak_days, last_activity_at

jobs                 → id, type, payload (jsonb), status (pending|processing|completed|failed),
                       created_at, updated_at
```

**Key design decisions:**
- `plays` replaces `enrollments` — a user simply "starts playing" a course, no prior enrollment needed for public courses.
- `user_stats` is global per user (not per course), reflecting the unified learner identity.
- `creator_id` in `courses` links to `profiles`, with no special role required to create a course.

### 4.3 Row Level Security (RLS) Rules

| Table | Rule |
|---|---|
| `courses` | Creator can read/write their own. All users can read `public` courses. Admins can read all. |
| `course_pdfs` | Creator only. |
| `modules / lessons / exercises` | Creator can write. Any user can read if course is `public`. |
| `plays` | User can read/write their own plays only. |
| `lesson_progress / exercise_attempts` | User can read/write their own records only. |
| `user_stats` | User can read/write their own stats only. |
| `jobs` | Server-side only (service role). |

---

## 5. Functional Modules

---

### 5.1 Authentication Module

#### Functional Requirements

- **FR-AUTH-01:** The system must offer registration via email and password.
- **FR-AUTH-02:** The system must support login via OAuth (Google).
- **FR-AUTH-03:** All new accounts are assigned `role: user` by default. The admin role is assigned manually via database or admin panel.
- **FR-AUTH-04:** The system must protect all routes via authentication middleware. Admin routes require `role: admin`.
- **FR-AUTH-05:** The system must implement password recovery via email.

---

### 5.2 Unified User Dashboard

This is the home screen for every non-admin user after login. It consolidates the creator and learner experiences in a single view.

#### Functional Requirements

- **FR-DASH-01:** The dashboard must display three distinct sections:
  1. **My Courses** — courses the user has created (with status badge: private / pending / public).
  2. **Continue Playing** — courses the user has started playing (own or public), with progress bar.
  3. **Discover** — a curated selection of public courses the user hasn't played yet.

- **FR-DASH-02:** A prominent "Create New Course" button must be accessible from the dashboard at all times.

- **FR-DASH-03:** Each course card in "My Courses" must show action buttons contextual to its status:
  - `private` → "Edit", "Play", "Submit for Review"
  - `pending_review` → "Preview" (read-only), "Cancel Submission"
  - `public` → "Edit", "Play", "Make Private"
  - `rejected` → "Edit", "View Rejection Reason", "Resubmit"

- **FR-DASH-04:** The dashboard must display the user's current streak and total XP as a persistent header element.

---

### 5.3 Course Creation Module

#### 5.3.1 Course Setup

**Functional Requirements**

- **FR-CRS-01:** Any authenticated user must be able to create a new course by providing: title, description, cover image, and AI generation settings (number of modules, number of lessons per module).
- **FR-CRS-02:** The user must be able to upload one or more PDFs as source material.
- **FR-CRS-03:** The system must accept PDFs up to 50 MB per file, with a maximum of 5 files per course.
- **FR-CRS-04:** The system must display PDF processing status in real time (waiting, processing, completed, error).
- **FR-CRS-05:** The user must be able to manually trigger AI content generation after uploading PDFs.
- **FR-CRS-06:** The system must display an estimated time to completion for content generation.
- **FR-CRS-07:** A newly created course must always start with `visibility: private`.

#### 5.3.2 AI Content Generation Pipeline

```
1. PDF upload → Supabase Storage (private bucket)
2. Job registered in the `jobs` table (status: pending)
3. Text extracted from PDF (pdf-parse)
4. Full text sent to Gemini API in a single context window
   (no chunking needed for up to ~700 pages thanks to 1M token context)
5. Call to Google Gemini API (gemini-2.5-flash) with structured prompt:
   - Input: extracted text + config (N modules, M lessons/module)
   - Output: structured JSON with modules, lessons, content blocks, and exercises
6. Generated content persisted to database tables
7. Job status updated (completed | failed)
8. User notified via Supabase Realtime
```

**Generation Prompt (guidelines for the AI agent)**

The prompt sent to the Google Gemini API must use `responseMimeType: "application/json"` with a defined `responseSchema` (Gemini's native Structured Output) to guarantee valid JSON. Expected schema:

```json
{
  "modules": [
    {
      "title": "string",
      "order_index": 1,
      "lessons": [
        {
          "title": "string",
          "order_index": 1,
          "content_blocks": [
            { "type": "text", "content": "string" },
            { "type": "tip", "content": "string" },
            { "type": "highlight", "content": "string" }
          ],
          "exercises": [
            {
              "type": "multiple_choice | true_false | fill_blank | ordering",
              "question": "string",
              "options": ["string"],
              "correct_answer": "string | string[]",
              "explanation": "string"
            }
          ]
        }
      ]
    }
  ]
}
```

#### 5.3.3 Content Editing

**Functional Requirements**

- **FR-CRS-08:** The user must be able to view generated content organized by modules and lessons.
- **FR-CRS-09:** The user must be able to edit the title and text of any content block.
- **FR-CRS-10:** The user must be able to add, edit, and remove exercises from any lesson.
- **FR-CRS-11:** The user must be able to reorder modules and lessons via drag-and-drop.
- **FR-CRS-12:** The user must be able to regenerate content for a specific module without affecting the rest.
- **FR-CRS-13:** All changes must be auto-saved (autosave with 2s debounce).

#### 5.3.4 Visibility and Publication

**Functional Requirements**

- **FR-CRS-14:** From the course settings page, the user must be able to submit the course for public review by changing its visibility to `pending_review`.
- **FR-CRS-15:** A course in `pending_review` must be locked for editing (read-only) until a decision is made.
- **FR-CRS-16:** The user must be notified when their course is approved (→ `public`) or rejected (→ `private` with reason).
- **FR-CRS-17:** The user must be able to cancel a pending submission, reverting the course to `private`.
- **FR-CRS-18:** The user must be able to make a `public` course private again at any time.
- **FR-CRS-19:** The user must be able to delete any of their own courses regardless of status, with a confirmation prompt.

---

### 5.4 Course Discovery Module

**Functional Requirements**

- **FR-DSC-01:** Any authenticated user must be able to browse a public course catalog showing only `public` courses.
- **FR-DSC-02:** The catalog must support search by title and description keywords.
- **FR-DSC-03:** Each course card in the catalog must show: cover image, title, creator name, number of modules, and average completion rate.
- **FR-DSC-04:** The user must be able to start playing any public course directly from the catalog.
- **FR-DSC-05:** Courses created by the current user must be excluded from the discovery feed (they appear in "My Courses" instead).

---

### 5.5 Learning Module (Lesson Engine)

#### 5.5.1 Course Map

**Functional Requirements**

- **FR-LRN-01:** When entering a course to play, the user must see a visual map in Duolingo style: modules as checkpoints on a vertical trail.
- **FR-LRN-02:** Completed modules and lessons must display a distinct visual state (color, icon).
- **FR-LRN-03:** The user can only access the next lesson after completing the previous one (sequential unlocking).
- **FR-LRN-04:** The user must be able to freely revisit already completed lessons for review.
- **FR-LRN-05:** A "play" session is automatically created the first time a user starts a course (`plays` record). Progress is tracked per play session.

#### 5.5.2 Lesson Engine

**Functional Requirements**

- **FR-LRN-06:** Each lesson consists of a sequence of screens alternating between content blocks and exercises.
- **FR-LRN-07:** The lesson must display a progress bar at the top indicating screens remaining.
- **FR-LRN-08:** The user must be able to exit a lesson and resume from where they left off.

**Screen Types**

| Type | Description |
|---|---|
| `content_text` | Explanatory text with rich formatting |
| `content_tip` | Tip or highlight in a special card (e.g., "Did you know?") |
| `exercise_multiple_choice` | Question with 4 options, only one correct |
| `exercise_true_false` | Statement to judge as true or false |
| `exercise_fill_blank` | Text with a blank to fill in |
| `exercise_ordering` | Ordering items/sentences in the correct sequence |

**Exercise Functional Requirements**

- **FR-LRN-09:** On answering an exercise, the system must display immediate feedback: green screen with positive reinforcement (correct) or red screen with the correct answer and explanation (incorrect).
- **FR-LRN-10:** The user must have a lives (hearts) system: starts with 5 lives per lesson; each mistake removes one life; at zero lives the lesson pauses and can be resumed after 30 minutes or immediately via a power-up.
- **FR-LRN-11:** Upon completing a lesson, the user sees a celebration screen with XP earned and an animation.
- **FR-LRN-12:** The creator of a course playing their own course follows the same lesson engine as any other player — no special mode.

---

### 5.6 Gamification System

**Functional Requirements**

- **FR-GAM-01 — XP (Experience Points):**
  - Lesson completed: +10 XP
  - Exercise correct on first attempt: +5 XP
  - Perfect lesson (no mistakes): +20 XP bonus
  - XP is global per user, regardless of which course was played.

- **FR-GAM-02 — Streaks:**
  - Each consecutive day with at least one completed lesson increments the streak.
  - Missing a day resets the streak to zero.
  - Current streak is displayed prominently on the dashboard header.

- **FR-GAM-03 — Badges:**
  - "First Lesson": complete any lesson for the first time.
  - "Perfect Week": maintain a 7-day streak.
  - "Flawless": complete 5 lessons without any mistakes.
  - "Marathon": complete 3 lessons in a single day.
  - "Module Master": complete all lessons in a module.
  - "Course Graduate": complete 100% of any course.
  - "Creator": publish a course that gets approved.

- **FR-GAM-04 — Leaderboard:**
  - Weekly global leaderboard ranked by XP earned that week.
  - Displayed on the dashboard with the current user's position highlighted.

- **FR-GAM-05 — Power-ups:**
  - "Shield": prevents losing a life on one wrong answer (max 1 per lesson).
  - Power-ups are earned at XP milestones.

---

### 5.7 Admin Module

**Functional Requirements**

- **FR-ADM-01:** The admin must have a dedicated panel listing all courses with `pending_review` status, sorted by submission date (oldest first).
- **FR-ADM-02:** The admin must be able to fully preview any course's generated content before deciding.
- **FR-ADM-03:** The admin must be able to approve a course, setting its visibility to `public`. The creator is notified.
- **FR-ADM-04:** The admin must be able to reject a course, providing a mandatory written reason. The course reverts to `private` and the creator is notified with the reason.
- **FR-ADM-05:** The admin must be able to view all platform users, with the ability to deactivate accounts or change roles.
- **FR-ADM-06:** The admin must be able to pull any `public` course back to `private` (e.g., for policy violations), notifying the creator.
- **FR-ADM-07:** The admin dashboard must display platform metrics: total users, total courses by visibility status, total plays, and global completion rate.

---

## 6. Non-Functional Requirements

### 6.1 Performance

- **NFR-01:** Initial page load must be under 3 seconds on a 4G connection.
- **NFR-02:** Exercise screen transitions must occur in under 300ms.
- **NFR-03:** Text extraction and processing of a 10 MB PDF must complete in under 2 minutes.

### 6.2 Security

- **NFR-04:** All API routes must verify authentication via JWT (Supabase Auth).
- **NFR-05:** RLS must be enabled on all tables — users can only access data they own or that is explicitly public.
- **NFR-06:** PDF files must be stored in private Supabase Storage buckets, accessed via signed expirable URLs.
- **NFR-07:** The Gemini API key must be stored exclusively as a server-side environment variable (`GEMINI_API_KEY`), never sent to the client.

### 6.3 Accessibility

- **NFR-08:** The interface must follow WCAG 2.1 Level AA guidelines.
- **NFR-09:** All interactive elements must be keyboard-navigable.
- **NFR-10:** Minimum text contrast ratio must be 4.5:1.

### 6.4 Responsiveness

- **NFR-11:** The lesson engine must be fully functional on mobile (minimum breakpoint: 375px).
- **NFR-12:** The course creation and content editing flow must be optimized for desktop with tablet support.

### 6.5 Scalability

- **NFR-13:** The content generation system must support multiple concurrent jobs without degradation.
- **NFR-14:** The architecture must support multi-tenancy from day one via RLS (each user's data is fully isolated by default).

---

## 7. UX Guidelines

### 7.1 Visual Identity

- Color palette: vibrant, Duolingo-inspired — primary green (#58CC02), action blue (#1CB0F6), highlight yellow (#FFC800), error red (#FF4B4B).
- Typography: rounded sans-serif, bold weight for exercise titles.
- Icons: Lucide Icons or Heroicons.
- Illustrations: simple, friendly mascot character.

### 7.2 Design Principles

- **One home, two hats:** the dashboard must feel natural for both creating and learning without forcing the user to "switch modes."
- **Immediate feedback:** every learner action must have an instant visual response.
- **Celebrate progress:** animations and sounds on correct answers, lesson completion, badge unlocks, and course publication approval.
- **Mobile-first for learning:** the lesson engine is designed mobile-first.
- **Desktop-first for creation:** the course creation and content editor flows prioritize desktop usability.

---

## 8. Main User Flows

### 8.1 New User First Experience

```
1. Register → lands on dashboard
2. Dashboard shows: empty "My Courses", empty "Continue Playing", "Discover" feed with public courses
3. Two clear CTAs: "Create Your First Course" and "Explore Public Courses"
```

### 8.2 Create and Play a Private Course

```
1. Click "Create New Course"
2. Fill title, description, cover image, AI settings
3. Upload PDFs → trigger generation
4. Wait for processing (realtime status updates)
5. Review and edit generated content
6. Click "Play" on the course card → lesson engine starts
7. Progress is tracked; user earns XP and streaks
```

### 8.3 Publish a Course

```
1. From course settings, click "Submit for Public Review"
2. Course status → pending_review (locked for editing)
3. Admin receives notification in admin panel
4. Admin previews content → Approves or Rejects
5a. Approved → course status = public, creator notified, course appears in discovery feed
5b. Rejected → course reverts to private, creator notified with reason, can edit and resubmit
```

### 8.4 Discover and Play a Public Course

```
1. User opens Discover page or sees recommendations on dashboard
2. Browses or searches public courses
3. Clicks "Play" on a course → play session created
4. Course map displayed → selects first available lesson
5. Lesson engine runs → XP and progress tracked
```

### 8.5 Admin Review Flow

```
1. Admin logs in → Admin Dashboard
2. Views pending_review queue (sorted oldest first)
3. Opens course → reads all generated content
4. Approves → course goes public, creator notified
   OR
   Rejects → writes reason, course goes private, creator notified
```

---

## 9. Page Structure (Sitemap)

```
/
├── /auth/login
├── /auth/register
├── /auth/forgot-password
│
├── /dashboard                              ← Unified home (all users)
│
├── /courses/
│   ├── /courses/new                        ← Create course
│   └── /courses/[id]/
│       ├── edit                            ← Edit course settings & visibility
│       ├── content                         ← Edit generated content
│       └── play                            ← Course map + lesson engine entry
│
├── /discover                               ← Browse public courses
│
└── /admin/                                 ← Admin only
    ├── review                              ← Pending review queue
    ├── review/[courseId]                   ← Course review detail
    └── users                              ← User management
```

---

## 10. API Endpoints (Nuxt Server Routes)

### Auth / Profile
```
GET    /api/profile                          ← Get current user profile
PUT    /api/profile                          ← Update profile
```

### Courses
```
POST   /api/courses                          ← Create course
GET    /api/courses/mine                     ← List user's own courses
GET    /api/courses/discover                 ← List public courses (with search/filter)
GET    /api/courses/[id]                     ← Course details
PUT    /api/courses/[id]                     ← Update course settings
DELETE /api/courses/[id]                     ← Delete course (creator only)
POST   /api/courses/[id]/generate            ← Trigger AI content generation
POST   /api/courses/[id]/submit              ← Submit for public review (→ pending_review)
POST   /api/courses/[id]/cancel-submission   ← Cancel submission (→ private)
POST   /api/courses/[id]/make-private        ← Pull public course back to private
```

### Modules and Lessons
```
GET    /api/courses/[id]/modules             ← List modules
PUT    /api/modules/[id]                     ← Edit module
DELETE /api/modules/[id]                     ← Delete module
POST   /api/modules/[id]/lessons             ← Create lesson
PUT    /api/lessons/[id]                     ← Edit lesson
DELETE /api/lessons/[id]                     ← Delete lesson
PUT    /api/lessons/[id]/exercises           ← Update lesson exercises
```

### Playing
```
POST   /api/plays                            ← Start playing a course (creates play record)
GET    /api/plays/[courseId]                 ← Get user's play record for a course
POST   /api/plays/[playId]/lessons/[id]/complete   ← Mark lesson as completed
POST   /api/plays/[playId]/exercises/[id]/attempt  ← Record exercise attempt
GET    /api/plays/[playId]/progress          ← Full progress for a play session
```

### Stats and Gamification
```
GET    /api/stats/me                         ← Current user's XP, streak, badges
GET    /api/stats/leaderboard                ← Weekly global leaderboard
```

### Admin
```
GET    /api/admin/courses                    ← All courses (filterable by visibility)
POST   /api/admin/courses/[id]/approve       ← Approve course (→ public)
POST   /api/admin/courses/[id]/reject        ← Reject course (→ private + reason)
POST   /api/admin/courses/[id]/make-private  ← Force course back to private
GET    /api/admin/users                      ← All users
PUT    /api/admin/users/[id]                 ← Edit user (role, status)
GET    /api/admin/metrics                    ← Platform metrics
```

---

## 11. External Integrations

### 11.1 Google Gemini API

- **Primary model:** `gemini-2.5-flash`
- **Usage:** Generation of course structure (modules, lessons, exercises) from text extracted from PDFs.
- **Authentication:** API Key via `GEMINI_API_KEY` environment variable (server-side only).
- **SDK:** `@google/generative-ai` (official Node.js package).
- **Structured Output:** Use `responseMimeType: "application/json"` + `responseSchema` to guarantee valid JSON.
- **Long context:** The 1M token context window allows sending the full PDF text in a single API call, eliminating the need for chunking for most documents.
- **Estimated cost per generation:** ~$0.01–$0.03 per module generated (20–40k input tokens + 5–10k output tokens).
- **Free tier:** 15 RPM and 1,000 requests/day at no cost during development (Google AI Studio).
- **Considerations:** Implement retry with exponential backoff; log tokens per job for cost tracking; use `temperature: 0.4` for structural consistency.

**Sample call (reference for the AI agent):**

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: courseSchema, // typed JSON schema
    temperature: 0.4,
  },
});

const result = await model.generateContent(prompt);
const course = JSON.parse(result.response.text());
```

### 11.2 Supabase

- **Auth:** Session and user management.
- **Database:** PostgreSQL with RLS enabled on all tables.
- **Storage:** Private buckets for PDFs; public bucket for course cover images.
- **Realtime:** Job progress notifications during content generation.

---

## 12. Error Handling Policy

| Scenario | Behavior |
|---|---|
| Corrupted or unreadable PDF | Job marked as `failed`; user notified with guidance to re-upload |
| Google Gemini API error | Automatic retry 3x with exponential backoff; after total failure, notify user and mark job `failed` |
| Generation timeout | Job expired after 15 min; user can manually reprocess |
| Form validation error | Inline field feedback; never erase already-filled data |
| Unauthorized access to private course | Return 403; redirect to dashboard |
| Expired session | Redirect to login with return to original page after authentication |

---

## 13. Development Phases (Suggested Roadmap)

### Phase 1 — MVP
- Authentication (email/password + Google OAuth)
- Unified dashboard (My Courses, Continue Playing, Discover)
- Course creation + PDF upload + AI generation pipeline
- Basic content editor
- Lesson engine: multiple choice and true/false exercises
- Private play with progress tracking
- Visibility flow: private → pending → public / rejected
- Admin review panel

### Phase 2 — Full Gamification
- All exercise types (fill_blank, ordering)
- Lives (hearts) system
- XP, streaks, all badges, leaderboard
- Power-ups
- Animated celebration screens

### Phase 3 — Social and Discovery
- Public course catalog with search and filters
- Creator profile pages (public courses by a user)
- Course ratings and comments
- "Featured" courses curated by admin

### Phase 4 — Advanced Creation Tools
- Drag-and-drop content editor
- Partial module regeneration
- Analytics for course creators (plays, completion rate per lesson)
- Push notifications / PWA

### Phase 5 — Scale
- Multi-language support (i18n)
- SCORM export for LMS integration
- Public API for external integrations
- Monetization (premium courses, Stripe billing)

---

## 14. Acceptance Criteria by Module

### AC-01: Course Creation and Generation
- [ ] Any authenticated user can create a course from the dashboard.
- [ ] Given a valid PDF, the system generates content in under 5 minutes per module.
- [ ] The generated JSON is valid and correctly persisted to the database.
- [ ] The user is notified via Realtime when generation completes or fails.
- [ ] A newly created course always starts as `private`.

### AC-02: Visibility Flow
- [ ] The user can submit a course for review; it immediately becomes `pending_review` and is locked for editing.
- [ ] The user can cancel the submission; the course reverts to `private` and becomes editable again.
- [ ] After admin approval, the course appears in the public discovery catalog.
- [ ] After admin rejection, the course reverts to `private` with the rejection reason visible to the creator.

### AC-03: Lesson Engine
- [ ] The user can complete a lesson from start to finish without interface errors.
- [ ] Progress is saved if the user exits mid-lesson.
- [ ] Correct/incorrect feedback appears within 300ms of the user's response.
- [ ] The course creator playing their own course goes through the same lesson engine as any other user.

### AC-04: Gamification
- [ ] XP is credited immediately upon lesson completion.
- [ ] Streaks update correctly at midnight UTC.
- [ ] Badges are automatically awarded upon meeting their criteria.
- [ ] The "Creator" badge is awarded when a course is approved for the first time.

### AC-05: Discovery
- [ ] Only `public` courses appear in the discovery feed.
- [ ] A user's own courses do not appear in the discovery feed (they appear in "My Courses").
- [ ] Any user can start playing a public course directly from the discovery page.

### AC-06: Admin
- [ ] Admin can approve a pending course; it immediately becomes public.
- [ ] Admin can reject a course with a required written reason; it reverts to private.
- [ ] Admin can force any public course back to private.
- [ ] Non-admin users cannot access any `/admin/*` route.

---

## 15. Glossary

| Term | Definition |
|---|---|
| **Course** | A set of modules auto-generated from PDFs by a user |
| **Module** | Thematic grouping of lessons within a course |
| **Lesson** | Minimum learning unit composed of content blocks and exercises |
| **Exercise** | Interactive question to validate the learner's knowledge |
| **Screen** | Individual screen in the lesson engine (content or exercise) |
| **Play** | A user's active learning session for a specific course |
| **Visibility** | A course's access state: private, pending_review, public, or rejected |
| **XP** | Global experience points accumulated by a user across all courses |
| **Streak** | Number of consecutive days with at least one completed lesson |
| **Badge** | Achievement unlocked upon reaching specific milestones |
| **Heart (Life)** | Resource lost on incorrect answers; limits attempts without a pause |
| **Job** | Asynchronous background task (PDF extraction, AI generation) |
| **RLS** | Row Level Security — Supabase's row-level data access control mechanism |

---

*Document generated for use by an AI agent building the pdf2course system.*
