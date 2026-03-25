import { serverSupabaseClient } from '#supabase/server'
import { requireUser } from '../../../../../auth/requireUser'
import { requireRole } from '../../../../../auth/requireRole'
import { completeLessonService } from '../../../../../services/lessons/completeLessonService'
import { lessonCompleteSchema } from '../../../../../validators/courseSchemas'
import type { LessonCompletion } from '../../../../../../types/course'

export default defineEventHandler(async (event): Promise<LessonCompletion> => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)
  await requireRole(event, client, user.id)

  const courseId = getRouterParam(event, 'id')!
  const lessonId = getRouterParam(event, 'lessonId')!
  const { score_percent } = await readValidatedBody(event, lessonCompleteSchema.parse)

  return completeLessonService(client, courseId, lessonId, user.id, score_percent)
})
