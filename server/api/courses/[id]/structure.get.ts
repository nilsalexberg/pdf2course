import { serverSupabaseClient } from '#supabase/server'
import { requireUser } from '../../../auth/requireUser'
import { requireRole } from '../../../auth/requireRole'
import { getCourseById, listModulesWithLessons } from '../../../repositories/courseRepo'
import type { ModuleWithLessons } from '../../../../types/course'

export default defineEventHandler(async (event): Promise<ModuleWithLessons[]> => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)
  await requireRole(event, client, user.id)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course ID' })
  }

  const course = await getCourseById(client, id)
  if (course.producer_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return await listModulesWithLessons(client, id)
})
