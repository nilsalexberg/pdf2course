import { requireUser } from '../../../../auth/requireUser'
import { getCourseById, getCoursePdfById, deleteCoursePdfFromDb } from '../../../../repositories/courseRepo'
import { deleteCoursePdf } from '../../../../storage/coursePdfs'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const courseId = getRouterParam(event, 'id')
  const pdfId = getRouterParam(event, 'pdfId')
  if (!courseId || !pdfId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course or PDF ID' })
  }

  const course = await getCourseById(courseId)
  if (course.producer_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const pdf = await getCoursePdfById(pdfId)
  if (pdf.course_id !== courseId) {
    throw createError({ statusCode: 400, statusMessage: 'PDF does not belong to this course' })
  }

  await deleteCoursePdf(null, pdf.file_path)
  await deleteCoursePdfFromDb(pdfId)

  return { success: true }
})
