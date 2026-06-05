import { createError } from 'h3';
import {
  getCourseById,
  getLessonById,
  upsertLessonCompletion
} from '../../repositories/courseRepo';
import type { LessonCompletion } from '../../../types/course';

export async function completeLessonService(
  courseId: string,
  lessonId: string,
  userId: string,
  scorePercent: number
): Promise<LessonCompletion> {
  const course = await getCourseById(courseId);

  if (!course) {
    throw createError({ statusCode: 404, statusMessage: 'Course not found' });
  }

  if (course.producerId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  const lesson = await getLessonById(lessonId);
  if (lesson.courseId !== courseId) {
    throw createError({ statusCode: 404, statusMessage: 'Lesson not found' });
  }

  if (lesson.status !== 'ready') {
    throw createError({ statusCode: 400, statusMessage: 'Lesson content is not ready' });
  }

  return upsertLessonCompletion({
    userId: userId,
    lessonId: lessonId,
    courseId: courseId,
    scorePercent: scorePercent
  });
}
