import { createError } from 'h3';
import type { Course } from '../../../types/course';
import { GENERATION_IN_PROGRESS } from '../../../types/course';
import {
  getCourseById,
  listCoursePdfs,
  updateCourseGenerationStatus
} from '../../repositories/courseRepo';
import { getCourseGenerationQueue } from '../../queues/courseGenerationQueue';

export async function startCourseGeneration(
  userId: string,
  courseId: string
): Promise<Course | null> {
  const course = await getCourseById(courseId);

  if (!course) {
    throw createError({ statusCode: 404, statusMessage: 'Course not found' });
  }

  if (course.producerId !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  if (GENERATION_IN_PROGRESS.includes(course.generationStatus)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Course generation is already in progress'
    });
  }

  const pdfs = await listCoursePdfs(courseId);
  if (pdfs.length === 0) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Upload at least one PDF before generating the course'
    });
  }

  await getCourseGenerationQueue().add('generate', { courseId });

  return updateCourseGenerationStatus(courseId, 'processing');
}
