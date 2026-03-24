import type { Course } from '../../../types/course'
import type { MultipartFile } from '../../http/multipart'
import type { CourseCreateInput } from '../../validators/courseSchemas'
import { CourseCreateLimits } from '../../validators/courseSchemas'
import { insertCourse, updateCourseCoverUrl, insertCoursePdf } from '../../repositories/courseRepo'
import { buildCoverPath, uploadCourseCover, validateCoverFile } from '../../storage/courseCovers'
import { buildPdfPath, uploadCoursePdf, validatePdfFile } from '../../storage/coursePdfs'

export async function createCourse(
  client: any,
  userId: string,
  input: CourseCreateInput,
  coverFile: MultipartFile | null,
  pdfs: MultipartFile[],
): Promise<Course> {
  if (pdfs.length > CourseCreateLimits.pdfs.maxFiles) {
    throw createError({
      statusCode: 400,
      statusMessage: `Maximum ${CourseCreateLimits.pdfs.maxFiles} PDFs allowed`,
    })
  }

  const config = {
    num_modules: input.num_modules,
    lessons_per_module: input.lessons_per_module,
    language_level: input.language_level,
    focus: input.focus,
    language: input.language,
    tone: input.tone,
  }

  const course = await insertCourse(client, {
    producer_id: userId,
    title: input.title,
    description: input.description,
    cover_url: null,
    config,
  })

  // Handle Cover
  if (coverFile) {
    validateCoverFile(coverFile)
    const path = buildCoverPath(userId, course.id, coverFile.filename)
    await uploadCourseCover(client, path, coverFile)
    await updateCourseCoverUrl(client, course.id, path)
  }

  // Handle PDFs
  for (const pdf of pdfs) {
    validatePdfFile(pdf)
    const path = buildPdfPath(userId, course.id, pdf.filename)
    await uploadCoursePdf(client, path, pdf)
    await insertCoursePdf(client, {
      course_id: course.id,
      file_path: path,
      filename: pdf.filename,
      size_bytes: pdf.data.length,
    })
  }

  return { ...(course as any), cover_url: coverFile ? buildCoverPath(userId, course.id, coverFile.filename) : null }
}
