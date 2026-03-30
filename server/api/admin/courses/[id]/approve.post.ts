import { serverSupabaseClient } from '#supabase/server'
import type { Course } from '../../../../../types/course'
import { requireUser } from '../../../../auth/requireUser'
import { requireRole } from '../../../../auth/requireRole'
import { updateCourseStatus } from '../../../../repositories/courseRepo'

export default defineEventHandler(async (event): Promise<Course> => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)

  await requireRole(event, client, user.id, true)

  const id = getRouterParam(event, 'id')!

  return updateCourseStatus(client, id, 'approved', null)
})
