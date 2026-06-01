import { z } from 'zod'
import { requireUser } from '../../../../../auth/requireUser'
import { requireRole } from '../../../../../auth/requireRole'
import { processLessonGeneration } from '../../../../../services/lessons/processLessonGeneration'
import type { Lesson } from '../../../../../../types/course'

const paramsSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1),
})

export default defineEventHandler(async (event): Promise<Lesson> => {
  const user = await requireUser(event)
  await requireRole(event, user.id)

  const { id: courseId, lessonId } = await getValidatedRouterParams(event, paramsSchema.parse)

  return processLessonGeneration(courseId, lessonId, user.id)
})
