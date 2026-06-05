import type { Course } from '../../../types/course';
import { requireRole } from '../../auth/requireRole';
import { requireUser } from '../../auth/requireUser';
import { readCourseCreateMultipart } from '../../http/multipart';
import { updateCourse } from '../../services/courses/updateCourse';
import { courseCreateSchema } from '../../validators/courseSchemas';

export default defineEventHandler(async (event): Promise<Course> => {
  const user = await requireUser(event);
  await requireRole(event, user.id);

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course ID' });
  }

  const { fields, cover, pdfs } = await readCourseCreateMultipart(event);

  const parsed = courseCreateSchema.safeParse({
    title: fields.title ?? '',
    description: fields.description ?? '',
    numModules: fields.numModules ?? '',
    lessonsPerModule: fields.lessonsPerModule ?? '',
    languageLevel: fields.languageLevel ?? '',
    focus: fields.focus ?? '',
    language: fields.language ?? '',
    tone: fields.tone ?? ''
  });
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input'
    });
  }

  return updateCourse(user.id, id, parsed.data, cover, pdfs);
});
