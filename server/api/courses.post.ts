import type { Course } from '../../types/course';
import { requireRole } from '../auth/requireRole';
import { requireUser } from '../auth/requireUser';
import { readCourseCreateMultipart } from '../http/multipart';
import { createCourse } from '../services/courses/createCourse';
import { courseCreateSchema } from '../validators/courseSchemas';

export default defineEventHandler(async (event): Promise<Course> => {
  const user = await requireUser(event);
  await requireRole(event, user.id);

  const { fields, cover, pdfs } = await readCourseCreateMultipart(event);

  const parsed = courseCreateSchema.safeParse({
    title: fields.title ?? '',
    description: fields.description ?? '',
    num_modules: fields.num_modules ?? '',
    lessons_per_module: fields.lessons_per_module ?? '',
    language_level: fields.language_level ?? '',
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

  return createCourse(user.id, parsed.data, cover, pdfs);
});
