import { serverSupabaseClient } from '#supabase/server'
import type { CourseWithSignedCover } from '../../types/course'
import { requireRole } from '../auth/requireRole'
import { requireUser } from '../auth/requireUser'
import { listProducerCourses } from '../services/courses/listProducerCourses'

export default defineEventHandler(async (event): Promise<CourseWithSignedCover[]> => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)

  await requireRole(event, client, user.id)

  return await listProducerCourses(client, user.id)
})
