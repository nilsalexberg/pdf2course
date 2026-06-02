import { requireUser } from '../../../../../auth/requireUser'
import { requireRole } from '../../../../../auth/requireRole'
import { getCourseById, getCoursePdfById } from '../../../../../repositories/courseRepo'
import { createSignedPdfUrl } from '../../../../../storage/coursePdfs'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const courseId = getRouterParam(event, 'id')
  const pdfId = getRouterParam(event, 'pdfId')
  if (!courseId || !pdfId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course ID or PDF ID' })
  }

  const role = await requireRole(event, user.id)
  const course = await getCourseById(courseId)
  if (course.producer_id !== user.id && role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const pdf = await getCoursePdfById(pdfId)
  if (pdf.course_id !== courseId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const url = await createSignedPdfUrl(pdf.file_path)
  return { url }
})
