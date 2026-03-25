import { createError } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getCourseById, getLessonById, updateLessonStatus, updateLessonContent } from '../../repositories/courseRepo'
import { generateLessonContent } from '../gemini/generateLessonContent'
import type { Lesson } from '../../../types/course'

/**
 * Orchestrates lesson content generation:
 * 1. Validates ownership and lesson state.
 * 2. Marks lesson as 'generating'.
 * 3. Calls Gemini with RAG-retrieved context.
 * 4. Persists content and marks lesson as 'ready'.
 * 5. On any failure, marks lesson as 'failed' and re-throws.
 */
export async function processLessonGeneration(
  client: SupabaseClient,
  courseId: string,
  lessonId: string,
  userId: string,
): Promise<Lesson> {
  // ─── Authorization ──────────────────────────────────────────────────────────
  const course = await getCourseById(client, courseId)

  if (course.producer_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  if (course.generation_status !== 'ready') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Course structure must be fully generated before generating lesson content',
    })
  }

  // ─── Fetch lesson and verify it belongs to this course ──────────────────────
  const lesson = await getLessonById(client, lessonId)

  if (lesson.course_id !== courseId) {
    throw createError({ statusCode: 404, statusMessage: 'Lesson not found' })
  }

  if (lesson.status === 'generating') {
    throw createError({ statusCode: 409, statusMessage: 'Lesson content generation is already in progress' })
  }

  // ─── Generate ────────────────────────────────────────────────────────────────
  await updateLessonStatus(client, lessonId, 'generating')
  console.log(`[lesson-generation] Lesson ${lessonId} status → generating`)

  try {
    const content = await generateLessonContent(client, lesson, course.config)

    const updated = await updateLessonContent(client, lessonId, content)
    console.log(
      `[lesson-generation] Lesson ${lessonId} status → ready (${content.steps.filter(s => s.type !== 'section').length} exercises)`,
    )

    return updated
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[lesson-generation] Failed for lesson ${lessonId}: ${message}`)

    // Best-effort status update so the UI is never stuck showing 'generating'
    await updateLessonStatus(client, lessonId, 'failed', message).catch(() => { })
    throw err
  }
}
