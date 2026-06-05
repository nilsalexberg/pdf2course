import { requireUser } from '../../../../../auth/requireUser';
import { requireRole } from '../../../../../auth/requireRole';
import { completeLessonService } from '../../../../../services/lessons/completeLessonService';
import { lessonCompleteSchema } from '../../../../../validators/courseSchemas';
import type { LessonCompletion } from '../../../../../../types/course';

export default defineEventHandler(async (event): Promise<LessonCompletion> => {
  const user = await requireUser(event);
  await requireRole(event, user.id);

  const courseId = getRouterParam(event, 'id')!;
  const lessonId = getRouterParam(event, 'lessonId')!;
  const { scorePercent } = await readValidatedBody(event, lessonCompleteSchema.parse);

  return completeLessonService(courseId, lessonId, user.id, scorePercent);
});
