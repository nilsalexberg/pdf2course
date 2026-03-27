import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import { requireUser } from '../../../../../auth/requireUser'
import { requireRole } from '../../../../../auth/requireRole'
import { getCourseById, getLessonById, updateLesson } from '../../../../../repositories/courseRepo'
import type { Lesson } from '../../../../../../types/course'

const bodySchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  learning_objectives: z.array(z.string()),
  key_topics: z.array(z.string()),
})

export default defineEventHandler(async (event): Promise<Lesson> => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)
  await requireRole(event, client, user.id)

  const id = getRouterParam(event, 'id')
  const lessonId = getRouterParam(event, 'lessonId')
  if (!id || !lessonId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course or lesson ID' })
  }

  const course = await getCourseById(client, id)
  if (course.producer_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const lesson = await getLessonById(client, lessonId)
  if (lesson.course_id !== id) {
    throw createError({ statusCode: 404, statusMessage: 'Lesson not found' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)

  return await updateLesson(client, lessonId, body)
})
