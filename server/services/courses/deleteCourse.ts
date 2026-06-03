import { createError } from 'h3';
import { getCourseById, deleteCourse as deleteRepoCourse } from '../../repositories/courseRepo';
import { deleteCourseCover } from '../../storage/courseCovers';

export async function deleteCourse(userId: string, courseId: string): Promise<void> {
  const course = await getCourseById(courseId);
  if (!course) throw createError({ statusCode: 404, statusMessage: 'Course not found' });

  if (course.producer_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  if (course.cover_url) {
    try {
      await deleteCourseCover(course.cover_url);
    } catch {
      // ignore missing
    }
  }

  await deleteRepoCourse(courseId);
}
