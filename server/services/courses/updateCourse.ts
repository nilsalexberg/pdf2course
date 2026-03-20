import { createError } from 'h3'
import type { Course } from '../../../types/course'
import type { MultipartFile } from '../../http/multipart'
import type { CourseCreateInput } from '../../validators/courseSchemas'
import { getCourseById, updateCourse as updateRepoCourse, updateCourseCoverUrl, insertCoursePdf } from '../../repositories/courseRepo'
import { buildCoverPath, uploadCourseCover, validateCoverFile, deleteCourseCover } from '../../storage/courseCovers'
import { buildPdfPath, uploadCoursePdf, validatePdfFile } from '../../storage/coursePdfs'

export async function updateCourse(
  client: any,
  userId: string,
  courseId: string,
  input: CourseCreateInput,
  coverFile: MultipartFile | null,
  pdfs: MultipartFile[] = [],
): Promise<Course> {
  const course = await getCourseById(client, courseId)

  // Security check: ensure the user owns the course
  if (course.producer_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const config = { num_modules: input.num_modules, lessons_per_module: input.lessons_per_module }

  const updatedCourse = await updateRepoCourse(client, courseId, {
    title: input.title,
    description: input.description,
    config,
  })

  if (coverFile) {
    validateCoverFile(coverFile)

    // If there's an old cover, delete it
    if (course.cover_url) {
      try {
        await deleteCourseCover(client, course.cover_url)
      } catch (err) {
        // Ignore if old cover is missing
      }
    }

    const coverPath = buildCoverPath(userId, courseId, coverFile.filename)
    await uploadCourseCover(client, coverPath, coverFile)
    await updateCourseCoverUrl(client, courseId, coverPath)
    
    // Update the return object path
    updatedCourse.cover_url = coverPath
  }

  // Handle PDFs
  for (const pdf of pdfs) {
    validatePdfFile(pdf)
    const pdfPath = buildPdfPath(userId, courseId, pdf.filename)
    await uploadCoursePdf(client, pdfPath, pdf)
    await insertCoursePdf(client, {
      course_id: courseId,
      file_path: pdfPath,
      filename: pdf.filename,
      size_bytes: pdf.data.length,
    })
  }

  return updatedCourse
}
