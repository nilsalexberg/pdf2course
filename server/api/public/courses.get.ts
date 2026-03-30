import { serverSupabaseClient } from '#supabase/server'
import type { CourseWithSignedCover } from '../../../types/course'
import { requireUser } from '../../auth/requireUser'
import { requireRole } from '../../auth/requireRole'
import { listPublicCourses } from '../../services/courses/listPublicCourses'

const PAGE_SIZE = 10

export default defineEventHandler(async (event): Promise<{ courses: CourseWithSignedCover[]; total: number }> => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)
  await requireRole(event, client, user.id)

  const query = getQuery(event)
  const search = typeof query.q === 'string' && query.q.trim() ? query.q.trim() : undefined
  const page = Math.max(1, Number(query.page) || 1)
  const offset = (page - 1) * PAGE_SIZE

  return listPublicCourses(client, { search, limit: PAGE_SIZE, offset })
})
