import type { Course } from '../../../../types/course';
import { requireUser } from '../../../auth/requireUser';
import { requireRole } from '../../../auth/requireRole';
import { getCourseById, updateCourseStatus } from '../../../repositories/courseRepo';

export default defineEventHandler(async (event): Promise<Course> => {
  const user = await requireUser(event);
  await requireRole(event, user.id);

  const id = getRouterParam(event, 'id')!;
  const course = await getCourseById(id);

  if (course.producer_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  if (course.generation_status !== 'ready') {
    throw createError({
      statusCode: 422,
      statusMessage: 'Course structure must be fully generated before submitting for review.'
    });
  }

  if (course.status !== 'draft' && course.status !== 'rejected') {
    throw createError({
      statusCode: 422,
      statusMessage: 'Only draft or rejected courses can be submitted for review.'
    });
  }

  return updateCourseStatus(id, 'pending_review', null);
});
