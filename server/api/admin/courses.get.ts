import { serverSupabaseClient } from '#supabase/server'
import type { CourseWithSignedCover } from '../../../types/course'
import { requireUser } from '../../auth/requireUser'
import { requireRole } from '../../auth/requireRole'
import { listAllCourses } from '../../services/courses/listAllCourses'

export default defineEventHandler(async (event): Promise<CourseWithSignedCover[]> => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)

  await requireRole(event, client, user.id, true)

  return listAllCourses(client)
})
