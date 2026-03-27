import { serverSupabaseClient } from '#supabase/server'
import { requireUser } from '../../../../../auth/requireUser'
import { getCourseById, getCoursePdfById } from '../../../../../repositories/courseRepo'
import { createSignedPdfUrl } from '../../../../../storage/coursePdfs'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)
  const courseId = getRouterParam(event, 'id')
  const pdfId = getRouterParam(event, 'pdfId')

  if (!courseId || !pdfId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course ID or PDF ID' })
  }

  const course = await getCourseById(client, courseId)
  if (course.producer_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const pdf = await getCoursePdfById(client, pdfId)
  if (pdf.course_id !== courseId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const url = await createSignedPdfUrl(client, pdf.file_path)
  return { url }
})
