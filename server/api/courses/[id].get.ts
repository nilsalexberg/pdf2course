import type { CourseWithSignedCover } from '../../../types/course';
import { requireRole } from '../../auth/requireRole';
import { requireUser } from '../../auth/requireUser';
import { getCourse } from '../../services/courses/getCourse';

export default defineEventHandler(async (event): Promise<CourseWithSignedCover> => {
  const user = await requireUser(event);
  await requireRole(event, user.id);

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course ID' });
  }

  return getCourse(id);
});
