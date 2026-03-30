import { serverSupabaseClient } from '#supabase/server'
import { requireUser } from '../../../auth/requireUser'
import { requireRole } from '../../../auth/requireRole'
import { getCourseById, listCoursePdfs } from '../../../repositories/courseRepo'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)
  const courseId = getRouterParam(event, 'id')

  if (!courseId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course ID' })
  }

  const role = await requireRole(event, client, user.id)
  const course = await getCourseById(client, courseId)
  if (course.producer_id !== user.id && role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return listCoursePdfs(client, courseId)
})
