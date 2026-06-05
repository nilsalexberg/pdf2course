import { createError } from 'h3';
import { getCourseById, deleteCourse as deleteRepoCourse } from '../../repositories/courseRepo';
import { deleteCourseCover } from '../../storage/courseCovers';

export async function deleteCourse(userId: string, courseId: string): Promise<void> {
  const course = await getCourseById(courseId);
  if (!course) throw createError({ statusCode: 404, statusMessage: 'Course not found' });

  if (course.producerId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  if (course.coverUrl) {
    try {
      await deleteCourseCover(course.coverUrl);
    } catch {
      // ignore missing
    }
  }

  await deleteRepoCourse(courseId);
}
