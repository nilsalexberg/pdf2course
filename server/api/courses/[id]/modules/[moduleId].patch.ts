import { z } from 'zod'
import { requireUser } from '../../../../auth/requireUser'
import { requireRole } from '../../../../auth/requireRole'
import { getCourseById, updateModule } from '../../../../repositories/courseRepo'
import type { Module } from '../../../../../types/course'

const bodySchema = z.object({
  title: z.string().min(1),
  description: z.string(),
})

export default defineEventHandler(async (event): Promise<Module> => {
  const user = await requireUser(event)
  await requireRole(event, user.id)

  const id = getRouterParam(event, 'id')
  const moduleId = getRouterParam(event, 'moduleId')
  if (!id || !moduleId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course or module ID' })
  }

  const course = await getCourseById(id)
  if (course.producer_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)
  return updateModule(moduleId, body)
})
