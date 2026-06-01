import { z } from 'zod'
import { requireUser } from '../../../../../auth/requireUser'
import { requireRole } from '../../../../../auth/requireRole'
import { getCourseById, getLessonById, updateLessonContent } from '../../../../../repositories/courseRepo'
import type { Lesson } from '../../../../../../types/course'

const stepSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('section'),
    title: z.string().min(1),
    content: z.string().min(1),
  }),
  z.object({
    type: z.literal('multiple_choice'),
    question: z.string().min(1),
    options: z.array(z.string()).min(2).max(4),
    correct_index: z.number().int().min(0).max(3),
    explanation: z.string(),
  }),
  z.object({
    type: z.literal('true_false'),
    statement: z.string().min(1),
    is_true: z.boolean(),
    explanation: z.string(),
  }),
  z.object({
    type: z.literal('fill_blank'),
    sentence: z.string().min(1),
    answer: z.string().min(1),
    explanation: z.string(),
  }),
])

const bodySchema = z.object({
  introduction: z.string().min(1),
  steps: z.array(stepSchema).min(1),
  summary: z.string().min(1),
})

export default defineEventHandler(async (event): Promise<Lesson> => {
  const user = await requireUser(event)
  await requireRole(event, user.id)

  const id = getRouterParam(event, 'id')
  const lessonId = getRouterParam(event, 'lessonId')
  if (!id || !lessonId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course or lesson ID' })
  }

  const course = await getCourseById(id)
  if (course.producer_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const lesson = await getLessonById(lessonId)
  if (lesson.course_id !== id) {
    throw createError({ statusCode: 404, statusMessage: 'Lesson not found' })
  }

  if (lesson.status !== 'ready') {
    throw createError({ statusCode: 422, statusMessage: 'Lesson content can only be edited after generation' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)
  return updateLessonContent(lessonId, body)
})
