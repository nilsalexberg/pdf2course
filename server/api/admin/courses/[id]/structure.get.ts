import type { ModuleWithLessons } from '../../../../../types/course';
import { requireUser } from '../../../../auth/requireUser';
import { requireRole } from '../../../../auth/requireRole';
import { listModulesWithLessons } from '../../../../repositories/courseRepo';

export default defineEventHandler(async (event): Promise<ModuleWithLessons[]> => {
  const user = await requireUser(event);
  await requireRole(event, user.id, true);

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course ID' });
  }

  return listModulesWithLessons(id);
});
