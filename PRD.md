# PRD — pdf2course
## Automatic Duolingo-Style Course Generator from PDFs

---

**Version:** 1.2  
**Date:** 2026-03-16  
**Status:** Draft  
**Stack:** Nuxt.js · TypeScript · Tailwind CSS · Supabase · Google Gemini 2.5 Flash
**Language:** English

---

## 1. Product Overview

### 1.1 Problem

Educational content producers — teachers, corporate trainers, coaches, and content creators — have instructional material in PDF format but lack accessible tools to transform it into engaging learning experiences. Building a gamified course from scratch requires significant time, technical resources, and instructional design expertise that most producers simply do not have.

### 1.2 Solution

**pdf2course** is a SaaS platform that allows content producers to upload PDFs and automatically generate Duolingo-style gamified courses from them — with structured lessons, interactive exercises, a points system, and visual progress tracking — without any technical knowledge required.

### 1.3 Business Goals

- Reduce to under 30 minutes the time needed for a producer to publish a course from a PDF.
- Deliver a learning experience with a retention rate above 70% (measured by module completion).
- Enable a multi-tenant platform: multiple producers, multiple courses, multiple students.

### 1.4 Success Metrics (KPIs)

| Metric | Initial Target |
|---|---|
| Average course creation time | < 30 min |
| Student module completion rate | > 70% |
| Producer NPS | > 40 |
| AI content generation time | < 5 min per module |

---

## 2. Personas and Roles

### 2.1 Course Producer (`role: producer`)

An individual or organization that creates and manages courses. Can be a teacher, corporate trainer, coach, or content creator. Has PDFs with material they want to transform into a course.

**Needs:**
- Create courses quickly from existing material.
- Have control over the structure and generated content.
- Manage which students have access to their courses.

### 2.2 Student (`role: student`)

A person enrolled in one or more courses. Consumes content in the gamified format.

**Needs:**
- Learn in an engaging way with immediate feedback.
- Track progress visually.
- Resume from where they left off in any session.

### 2.3 Administrator (`role: admin`)

Responsible for platform health. Reviews courses before they are published, moderates content, and manages users.

**Needs:**
- View and approve/reject submitted courses.
- Manage all platform users.
- Have visibility into general platform metrics.

---

## 3. Architecture and Tech Stack

### 3.1 Stack

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
| Async Jobs / Queues | Supabase Edge Functions + pg_cron or custom queue via `jobs` table |

### 3.2 Core Data Model (Supabase / PostgreSQL)

```
users                → managed by Supabase Auth, extended with profiles table
profiles             → id, role (admin|producer|student), name, avatar_url
courses              → id, producer_id, title, description, status (draft|pending_review|approved|rejected), config (jsonb)
course_pdfs          → id, course_id, file_url, file_name, processing_status
modules              → id, course_id, order_index, title
lessons              → id, module_id, order_index, title, content_blocks (jsonb)
exercises            → id, lesson_id, type, question, options (jsonb), correct_answer, explanation
enrollments          → id, course_id, student_id, enrolled_at, status
lesson_progress      → id, enrollment_id, lesson_id, completed_at, attempts
exercise_attempts    → id, enrollment_id, exercise_id, answer, is_correct, attempted_at
student_stats        → id, enrollment_id, xp_total, streak_days, last_activity_at
jobs                 → id, type, payload (jsonb), status, created_at, updated_at
```

### 3.3 Nuxt Folder Structure

```
/
├── pages/
│   ├── auth/
│   ├── producer/
│   ├── admin/
│   └── learn/
├── server/
│   ├── api/
│   │   ├── courses/
│   │   ├── modules/
│   │   ├── lessons/
│   │   ├── enrollments/
│   │   ├── progress/
│   │   └── admin/
│   └── services/
│       ├── pdf-extractor.ts
│       ├── ai-generator.ts
│       └── job-processor.ts
├── composables/
├── components/
│   ├── producer/
│   ├── admin/
│   └── learn/
├── middleware/
│   ├── auth.ts
│   └── role.ts
└── supabase/
    └── migrations/
```

---

## 4. Functional Modules

---

### 4.1 Authentication Module

#### Functional Requirements

- **FR-AUTH-01:** The system must offer registration via email and password.
- **FR-AUTH-02:** The system must support login via OAuth (Google).
- **FR-AUTH-03:** After registration, the user must choose their role: producer or student. The admin role is assigned manually via the panel or seed script.
- **FR-AUTH-04:** The system must protect all routes according to the user's role (authentication and authorization middleware).
- **FR-AUTH-05:** The system must implement password recovery via email.

#### Business Rules

- A user can only have one primary role.
- Producers do not access the student area and vice versa (unless the admin grants dual access in the future).

---

### 4.2 Course Producer Module

#### 4.2.1 Course Creation and Configuration

**Functional Requirements**

- **FR-PROD-01:** The producer must be able to create a new course by providing: title, description, cover image, and game settings (desired number of modules, number of lessons per module).
- **FR-PROD-02:** The producer must be able to upload one or more PDFs for the course.
- **FR-PROD-03:** The system must accept PDFs up to 50 MB per file, with a maximum of 5 files per course.
- **FR-PROD-04:** The system must display PDF processing status in real time (waiting, processing, completed, error).
- **FR-PROD-05:** The producer must be able to manually trigger content generation after PDF upload.
- **FR-PROD-06:** The system must display an estimated time to completion for the generation process.

**AI Content Generation Pipeline**

```
1. PDF upload → Supabase Storage
2. Job registered in the `jobs` table (status: pending)
3. Text extraction from PDF (pdf-parse)
4. Full text sent to Gemini API in a single context window (no chunking needed for up to ~700 pages)
5. Call to Google Gemini API (`gemini-2.5-flash`) with structured prompt:
   - Input: extracted text + settings (N modules, M lessons/module)
   - Output: structured JSON with modules, lessons, content blocks, and exercises
6. Generated content persisted to database tables
7. Job status updated (completed | failed)
8. Producer notified via Supabase Realtime
```

**Generation Prompt (guidelines for the AI agent)**

The prompt sent to the Google Gemini API must use `responseMimeType: "application/json"` with a defined `responseSchema` (Gemini's native Structured Output) to guarantee valid JSON without defensive parsing. Expected schema:

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

#### 4.2.2 Generated Content Editing

**Functional Requirements**

- **FR-PROD-07:** The producer must be able to view generated content organized by modules and lessons.
- **FR-PROD-08:** The producer must be able to edit the title and text of content blocks in any lesson.
- **FR-PROD-09:** The producer must be able to add, edit, and remove exercises from any lesson.
- **FR-PROD-10:** The producer must be able to reorder modules and lessons via drag-and-drop.
- **FR-PROD-11:** The producer must be able to regenerate content for a specific module without losing the rest.
- **FR-PROD-12:** All changes must be auto-saved (autosave with 2s debounce).

#### 4.2.3 Student and Enrollment Management

**Functional Requirements**

- **FR-PROD-13:** The producer must be able to invite students by email to register on the platform.
- **FR-PROD-14:** The producer must be able to enroll existing users in their courses.
- **FR-PROD-15:** The producer must be able to unenroll students from their courses.
- **FR-PROD-16:** The producer must be able to view the list of enrolled students per course, with enrollment date and overall progress (%).
- **FR-PROD-17:** The producer must not be able to view sensitive personal data beyond student name and email.

#### 4.2.4 Submission for Review

**Functional Requirements**

- **FR-PROD-18:** The producer must be able to submit the course for admin review when the content is ready.
- **FR-PROD-19:** After submission, the course enters `pending_review` status and cannot be edited until a decision is made by the admin.
- **FR-PROD-20:** The producer must receive a notification when the course is approved or rejected, including the rejection reason when applicable.

#### 4.2.5 Producer Dashboard

**Functional Requirements**

- **FR-PROD-21:** The producer must have a dashboard showing: list of courses (with status), active students, and average progress per course.

---

### 4.3 Administrator Module

**Functional Requirements**

- **FR-ADM-01:** The admin must have access to a panel listing all platform courses, filterable by status.
- **FR-ADM-02:** The admin must be able to view the full content of any course before making a decision.
- **FR-ADM-03:** The admin must be able to approve a course, changing its status to `approved` and making it available to enrolled students.
- **FR-ADM-04:** The admin must be able to reject a course, providing a reason (free text), changing the status to `rejected`, and returning it to the producer for editing.
- **FR-ADM-05:** The admin must be able to manage all users: list, activate, deactivate, and change roles.
- **FR-ADM-06:** The admin must have an overview of platform metrics: total courses, users, enrollments, and overall completion rate.
- **FR-ADM-07:** The admin must be able to impersonate a user (view-only mode) for support purposes.

---

### 4.4 Student Module (Learning Experience)

#### 4.4.1 Student Home

**Functional Requirements**

- **FR-STU-01:** The student must see a dashboard with all their enrolled courses, with a progress bar and next-step indicator.
- **FR-STU-02:** The student must see their current streak (consecutive study days) with prominent visual display.
- **FR-STU-03:** The student must see their total XP and ranking position within each course (among enrolled students).

#### 4.4.2 Course Map

**Functional Requirements**

- **FR-STU-04:** When entering a course, the student must see a visual map in Duolingo style: modules as "islands" or checkpoints on a vertical trail.
- **FR-STU-05:** Completed modules and lessons must be displayed with a distinct visual state (color, icon).
- **FR-STU-06:** The student can only access the next lesson after completing the previous one (sequential unlocking).
- **FR-STU-07:** The student must be able to freely revisit already completed lessons.

#### 4.4.3 Lesson Engine

**Functional Requirements**

- **FR-STU-08:** Each lesson consists of a sequence of screens alternating between content blocks and exercises.
- **FR-STU-09:** The lesson must have a progress bar at the top indicating how many screens remain.
- **FR-STU-10:** The student must be able to exit a lesson and resume from where they left off.

**Screen Types**

| Type | Description |
|---|---|
| `content_text` | Explanatory text with rich formatting |
| `content_tip` | Tip or highlight in a special card (e.g., "Did you know?") |
| `exercise_multiple_choice` | Question with 4 options, only one correct |
| `exercise_true_false` | Statement to be judged as true or false |
| `exercise_fill_blank` | Text with a blank to fill in |
| `exercise_ordering` | Ordering items/sentences in the correct sequence |

**Exercise Functional Requirements**

- **FR-STU-11:** When answering an exercise, the system must display immediate feedback: green screen with positive reinforcement (correct) or red screen with the correct answer and explanation (incorrect).
- **FR-STU-12:** The student must have a "lives" (hearts) system: starts with 5 lives; each mistake removes one life; when all lives are lost, the lesson is interrupted and can be resumed after 30 minutes or immediately by using a power-up.
- **FR-STU-13:** Upon completing a lesson, the student must see a celebration screen showing XP earned and an animation.

#### 4.4.4 Gamification System

**Functional Requirements**

- **FR-GAM-01 — XP (Experience Points):**
  - Lesson completed: +10 XP base
  - Exercise answered correctly on first attempt: +5 XP
  - Lesson completed without any mistakes (perfect lesson): +20 XP bonus

- **FR-GAM-02 — Streaks:**
  - Each consecutive day of activity increments the streak.
  - The streak resets if the student does not complete at least one lesson per day.
  - Current streak displayed prominently on the dashboard.

- **FR-GAM-03 — Achievements (Badges):**
  - "First Lesson": complete the first lesson.
  - "Perfect Week": 7-day streak.
  - "Flawless": complete 5 lessons without any mistakes.
  - "Marathon": complete 3 lessons in a single day.
  - "Module Master": complete all lessons in a module.
  - "Course Graduate": complete 100% of a course.

- **FR-GAM-04 — Leaderboard:**
  - Weekly ranking by XP, scoped per course.
  - Display of top 10 students with the current student's position.

- **FR-GAM-05 — Power-ups:**
  - "Shield": protects against losing a life on one incorrect answer (limit: 1 per lesson).
  - Power-ups are earned by reaching XP milestones.

---

## 5. Non-Functional Requirements

### 5.1 Performance

- **NFR-01:** Initial page load time must be under 3 seconds on a 4G connection.
- **NFR-02:** Transitions between exercise screens must occur in under 300ms.
- **NFR-03:** Extraction and processing of a 10 MB PDF must complete in under 2 minutes.

### 5.2 Security

- **NFR-04:** All API routes must verify authentication via JWT (Supabase Auth).
- **NFR-05:** The system must implement Row Level Security (RLS) in Supabase to ensure users only access data they are authorized for.
- **NFR-06:** PDF uploads must be stored in private Supabase Storage buckets with signed, expirable URLs.
- **NFR-07:** The Gemini API key must be stored exclusively as a server-side environment variable and never exposed to the client.

### 5.3 Accessibility

- **NFR-08:** The interface must follow WCAG 2.1 Level AA guidelines.
- **NFR-09:** All interactive elements must be keyboard-navigable.
- **NFR-10:** Minimum text contrast ratio must be 4.5:1.

### 5.4 Responsiveness

- **NFR-11:** The student area (lesson engine) must be fully functional on mobile devices (minimum breakpoint: 375px).
- **NFR-12:** The producer area must be optimized for desktop with tablet support.

### 5.5 Scalability

- **NFR-13:** The content generation system must support multiple parallel jobs without degradation.
- **NFR-14:** The architecture must support multi-tenancy from day one via RLS.

---

## 6. UX Guidelines

### 6.1 Visual Identity

- Color palette: vibrant, Duolingo-inspired — primary green (#58CC02), action blue (#1CB0F6), highlight yellow (#FFC800), error red (#FF4B4B).
- Typography: rounded sans-serif, bold weight for exercise titles.
- Icons: Lucide Icons or Heroicons.
- Illustrations: simple, friendly mascot character (bird, robot, or geometric character).

### 6.2 Design Principles

- **Immediate feedback:** every student action must have an instant visual response.
- **Celebrate progress:** subtle animations and sounds on correct answers, lesson completion, and badge unlocks.
- **Clarity over complexity:** the interface must feel simple even if the underlying system is complex.
- **Mobile-first for students:** the lesson engine must be designed with mobile as the primary platform.

---

## 7. Main User Flows

### 7.1 Producer Flow: Create and Publish a Course

```
1. Login → Producer Dashboard
2. Click "New Course"
3. Fill in title, description, cover image
4. Configure: number of modules and lessons per module
5. Upload PDFs
6. Wait for processing (polling / realtime)
7. Review and edit generated content
8. Enroll students
9. Submit for review
10. Wait for admin approval
11. Course published → students notified
```

### 7.2 Admin Flow: Review a Course

```
1. Login → Admin Dashboard
2. View "pending_review" course queue
3. Open course → review content
4. Approve (course moves to "approved") OR Reject (provide reason)
5. Producer receives notification
```

### 7.3 Student Flow: Study a Lesson

```
1. Login → Student Dashboard
2. Select course
3. View course map → select next available lesson
4. Lesson engine starts
5. Screen sequence: content → exercise → content → exercise...
6. Feedback on each exercise
7. Completion screen with XP earned
8. Return to map with updated progress
```

---

## 8. Page Structure (Sitemap)

```
/
├── /auth/login
├── /auth/register
├── /auth/forgot-password
│
├── /producer/                          ← Producer Dashboard
│   ├── /producer/courses               ← Course list
│   ├── /producer/courses/new           ← Create course
│   ├── /producer/courses/[id]/edit     ← Edit settings
│   ├── /producer/courses/[id]/content  ← Generated content editor
│   └── /producer/courses/[id]/students ← Student management
│
├── /admin/                             ← Admin Dashboard
│   ├── /admin/courses                  ← Review queue and all courses
│   ├── /admin/courses/[id]/review      ← Review screen
│   └── /admin/users                    ← User management
│
└── /learn/                             ← Student Dashboard
    ├── /learn/courses                  ← Enrolled courses
    ├── /learn/courses/[id]             ← Course map
    └── /learn/courses/[id]/lessons/[lessonId] ← Lesson engine
```

---

## 9. API Endpoints (Nuxt Server Routes)

### Courses
```
POST   /api/courses                          ← Create course
GET    /api/courses                          ← List producer's courses
GET    /api/courses/[id]                     ← Course details
PUT    /api/courses/[id]                     ← Update course
POST   /api/courses/[id]/submit              ← Submit for review
POST   /api/courses/[id]/generate            ← Trigger content generation
```

### Modules and Lessons
```
GET    /api/courses/[id]/modules             ← List modules
PUT    /api/modules/[id]                     ← Edit module
POST   /api/modules/[id]/lessons             ← Create lesson
PUT    /api/lessons/[id]                     ← Edit lesson
PUT    /api/lessons/[id]/exercises           ← Update lesson exercises
```

### Enrollments
```
POST   /api/courses/[id]/enroll              ← Enroll student
DELETE /api/courses/[id]/enroll/[studentId]  ← Unenroll student
GET    /api/courses/[id]/students            ← List enrolled students
```

### Progress (Student)
```
GET    /api/learn/courses                    ← Student's courses with progress
POST   /api/learn/lessons/[id]/complete      ← Mark lesson as completed
POST   /api/learn/exercises/[id]/attempt     ← Record exercise attempt
GET    /api/learn/courses/[id]/stats         ← Student stats for course
```

### Admin
```
GET    /api/admin/courses                    ← All courses
POST   /api/admin/courses/[id]/approve       ← Approve course
POST   /api/admin/courses/[id]/reject        ← Reject course
GET    /api/admin/users                      ← All users
PUT    /api/admin/users/[id]                 ← Edit user
```

---

## 10. External Integrations

### 10.1 Google Gemini API

- **Primary model:** `gemini-2.5-flash`
- **Usage:** Generation of course structure (modules, lessons, exercises) from text extracted from PDFs.
- **Authentication:** API Key via `GEMINI_API_KEY` environment variable (server-side only, never exposed to the client).
- **SDK:** `@google/generative-ai` (official Node.js package).
- **Structured Output:** Use `responseMimeType: "application/json"` + `responseSchema` to guarantee valid JSON without defensive parsing.
- **Long context:** The 1M token context window allows sending the full PDF text in a single API call, eliminating the need for chunking for most documents.
- **Estimated cost per generation:** ~$0.01–$0.03 per module generated (20–40k input tokens + 5–10k output tokens).
- **Free tier:** Available during development — 15 RPM and 1,000 requests/day at no cost (Google AI Studio).
- **Considerations:** Implement retry with exponential backoff; log tokens consumed per job for cost tracking; set `temperature: 0.4` for higher structural consistency.

**Sample call (reference for the AI agent):**

```typescript
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

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

### 10.2 Supabase

- **Auth:** Session and user management.
- **Database:** PostgreSQL with RLS enabled.
- **Storage:** Buckets for PDFs and cover images.
- **Realtime:** Job progress notifications to the producer.

---

## 11. Error Handling Policy

| Scenario | Behavior |
|---|---|
| Corrupted or unreadable PDF | Job marked as `failed`; producer notified with guidance to re-upload |
| Google Gemini API error | Automatic retry 3x with exponential backoff; after total failure, notify producer and mark job as `failed` |
| Generation timeout | Job expired after 15 min; producer can reprocess |
| Form validation error | Inline field feedback, never erase already-filled data |
| Expired session | Redirect to login with return to original page after authentication |

---

## 12. Development Phases (Suggested Roadmap)

### Phase 1 — MVP (Minimum Viable Product)
- Authentication and roles (producer, student, admin)
- Course creation + PDF upload
- AI content generation pipeline
- Basic generated content editor
- Lesson engine with multiple choice and true/false
- Lesson progress and completion
- Admin approval flow

### Phase 2 — Full Gamification
- All exercise types (fill_blank, ordering)
- Lives (hearts) system
- XP, streaks, badges, and leaderboard
- Power-ups
- Animated celebration screens

### Phase 3 — Advanced Management
- Analytics dashboard for producers
- Student invitation by email
- Partial module regeneration
- Drag-and-drop in content editor
- Push notifications (PWA)

### Phase 4 — Scale
- Multi-language support (i18n)
- External LMS integration (SCORM export)
- Public API for external integrations
- Plans and billing (Stripe)

---

## 13. Acceptance Criteria by Module

### AC-01: Content Generation
- [ ] Given a valid PDF, the system must generate content in under 5 minutes per module.
- [ ] The generated JSON must be valid and correctly persisted in the database tables.
- [ ] The producer must be notified upon completion of processing.

### AC-02: Lesson Engine
- [ ] The student must be able to complete a lesson from start to finish without interface errors.
- [ ] Progress must be saved if the student exits mid-lesson.
- [ ] Correct/incorrect feedback must appear within 300ms of the student's response.

### AC-03: Gamification
- [ ] XP must be credited immediately upon lesson completion.
- [ ] Streaks must be updated correctly at midnight UTC.
- [ ] Badges must be automatically awarded upon meeting their criteria.

### AC-04: Approval Flow
- [ ] Courses with `draft` status must not be visible to students.
- [ ] Only courses with `approved` status must appear for enrolled students.
- [ ] The producer must not be able to edit a course with `pending_review` status.

---

## 14. Glossary

| Term | Definition |
|---|---|
| **Course** | Set of modules created by a producer from PDFs |
| **Module** | Thematic grouping of lessons within a course |
| **Lesson** | Minimum learning unit, composed of content blocks and exercises |
| **Exercise** | Interactive question to validate the student's knowledge |
| **Screen** | Individual screen within the lesson engine (content or exercise) |
| **XP** | Experience points accumulated by the student |
| **Streak** | Sequence of consecutive days of student activity |
| **Badge** | Achievement unlocked upon reaching specific milestones |
| **Heart (Life)** | Resource the student loses when answering incorrectly; limits attempts without a break |
| **Job** | Asynchronous processing task (PDF extraction, content generation) |
| **RLS** | Row Level Security — row-level access control mechanism in Supabase |

---

*Document generated for use by an AI agent building the pdf2course system.*
