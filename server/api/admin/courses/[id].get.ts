import { serverSupabaseClient } from '#supabase/server'
import type { CourseWithSignedCover } from '../../../../types/course'
import { requireUser } from '../../../auth/requireUser'
import { requireRole } from '../../../auth/requireRole'
import { getCourse } from '../../../services/courses/getCourse'

export default defineEventHandler(async (event): Promise<CourseWithSignedCover> => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)

  await requireRole(event, client, user.id, true)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course ID' })
  }

  return getCourse(client, id)
})
