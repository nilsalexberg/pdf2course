import type { Course } from '../../../../../types/course';
import { requireUser } from '../../../../auth/requireUser';
import { requireRole } from '../../../../auth/requireRole';
import { updateCourseStatus } from '../../../../repositories/courseRepo';

export default defineEventHandler(async (event): Promise<Course> => {
  const user = await requireUser(event);
  await requireRole(event, user.id, true);

  const id = getRouterParam(event, 'id')!;
  return updateCourseStatus(id, 'approved', null);
});
