import { createError } from 'h3'
import type { Course } from '../../../types/course'
import type { MultipartFile } from '../../http/multipart'
import type { CourseCreateInput } from '../../validators/courseSchemas'
import { getCourseById, updateCourse as updateRepoCourse, updateCourseCoverUrl } from '../../repositories/courseRepo'
import { buildCoverPath, uploadCourseCover, validateCoverFile, deleteCourseCover } from '../../storage/courseCovers'

export async function updateCourse(
  client: any,
  userId: string,
  courseId: string,
  input: CourseCreateInput,
  coverFile: MultipartFile | null,
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

  if (!coverFile) return updatedCourse

  validateCoverFile(coverFile)

  // If there's an old cover, delete it
  if (course.cover_url) {
    try {
      await deleteCourseCover(client, course.cover_url)
    } catch (err) {
      // Ignore if old cover is missing
    }
  }

  const path = buildCoverPath(userId, courseId, coverFile.filename)
  await uploadCourseCover(client, path, coverFile)
  await updateCourseCoverUrl(client, courseId, path)

  return { ...(updatedCourse as any), cover_url: path }
}
