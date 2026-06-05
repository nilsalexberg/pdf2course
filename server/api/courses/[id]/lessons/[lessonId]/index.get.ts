import { z } from 'zod';
import { requireUser } from '../../../../../auth/requireUser';
import { requireRole } from '../../../../../auth/requireRole';
import { getCourseById, getLessonById } from '../../../../../repositories/courseRepo';
import type { Lesson } from '../../../../../../types/course';

const paramsSchema = z.object({
  id: z.string().min(1),
  lessonId: z.string().min(1)
});

export default defineEventHandler(async (event): Promise<Lesson> => {
  const user = await requireUser(event);
  await requireRole(event, user.id);

  const { id: courseId, lessonId } = await getValidatedRouterParams(event, paramsSchema.parse);

  const course = await getCourseById(courseId);
  if (course.producerId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  const lesson = await getLessonById(lessonId);
  if (lesson.courseId !== courseId) {
    throw createError({ statusCode: 404, statusMessage: 'Lesson not found' });
  }

  return lesson;
});
