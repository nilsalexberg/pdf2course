import { serverSupabaseClient } from '#supabase/server'
import type { Course } from '../../../../types/course'
import { requireRole } from '../../../auth/requireRole'
import { requireUser } from '../../../auth/requireUser'
import { startCourseGeneration } from '../../../services/courses/startCourseGeneration'

export default defineEventHandler(async (event): Promise<Course> => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)

  await requireRole(event, client, user.id)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course ID' })
  }

  return await startCourseGeneration(client, user.id, id)
})
