import { serverSupabaseClient } from '#supabase/server'
import { requireUser } from '../../../auth/requireUser'
import { getCourseById, listCoursePdfs } from '../../../repositories/courseRepo'
import { createSignedPdfUrl } from '../../../storage/coursePdfs'
import type { CoursePdfWithSignedUrl } from '../../../../types/course'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)
  const courseId = getRouterParam(event, 'id')

  if (!courseId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course ID' })
  }

  const course = await getCourseById(client, courseId)
  if (course.producer_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const pdfs = await listCoursePdfs(client, courseId)

  const pdfsWithUrls: CoursePdfWithSignedUrl[] = await Promise.all(
    pdfs.map(async (pdf) => ({
      ...pdf,
      url_signed: await createSignedPdfUrl(client, pdf.file_path),
    })),
  )

  return pdfsWithUrls
})
