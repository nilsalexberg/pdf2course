import { serverSupabaseClient } from '#supabase/server'
import { createError } from 'h3'
import { z } from 'zod'
import { requireUser } from '../../../../../auth/requireUser'
import { requireRole } from '../../../../../auth/requireRole'
import { getCourseById, getLessonById } from '../../../../../repositories/courseRepo'
import type { Lesson } from '../../../../../../types/course'

const paramsSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
})

export default defineEventHandler(async (event): Promise<Lesson> => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)
  await requireRole(event, client, user.id)

  const { id: courseId, lessonId } = await getValidatedRouterParams(event, paramsSchema.parse)

  const course = await getCourseById(client, courseId)
  if (course.producer_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const lesson = await getLessonById(client, lessonId)
  if (lesson.course_id !== courseId) {
    throw createError({ statusCode: 404, statusMessage: 'Lesson not found' })
  }

  return lesson
})
