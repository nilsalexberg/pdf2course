import { requireUser } from '../../../auth/requireUser';
import { requireRole } from '../../../auth/requireRole';
import { getCourseById, listModulesWithLessons } from '../../../repositories/courseRepo';
import type { CourseStructure } from '../../../../types/course';

export default defineEventHandler(async (event): Promise<CourseStructure> => {
  const user = await requireUser(event);
  await requireRole(event, user.id);

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course ID' });
  }

  const course = await getCourseById(id);
  if (course.producerId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  return {
    courseTitle: course.title,
    modules: await listModulesWithLessons(id)
  };
});
