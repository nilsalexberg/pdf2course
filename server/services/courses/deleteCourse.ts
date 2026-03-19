import { createError } from 'h3'
import { getCourseById, deleteCourse as deleteRepoCourse } from '../../repositories/courseRepo'
import { deleteCourseCover } from '../../storage/courseCovers'

export async function deleteCourse(client: any, userId: string, courseId: string): Promise<void> {
  const course = await getCourseById(client, courseId)

  // Security check: ensure the user owns the course
  if (course.producer_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  if (course.cover_url) {
    try {
      await deleteCourseCover(client, course.cover_url)
    } catch (err) {
      // Ignore if missing
    }
  }

  await deleteRepoCourse(client, courseId)
}
