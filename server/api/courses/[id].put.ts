import { serverSupabaseClient } from '#supabase/server'
import type { Course } from '../../../types/course'
import { requireRole } from '../../auth/requireRole'
import { requireUser } from '../../auth/requireUser'
import { readCourseCreateMultipart } from '../../http/multipart'
import { updateCourse } from '../../services/courses/updateCourse'
import { courseCreateSchema } from '../../validators/courseSchemas'

export default defineEventHandler(async (event): Promise<Course> => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)

  await requireRole(event, client, user.id)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course ID' })
  }

  const { fields, cover } = await readCourseCreateMultipart(event)

  const parsed = courseCreateSchema.safeParse({
    title: fields.title ?? '',
    description: fields.description ?? '',
    num_modules: fields.num_modules ?? '',
    lessons_per_module: fields.lessons_per_module ?? '',
  })
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? 'Invalid input',
    })
  }

  return await updateCourse(client, user.id, id, parsed.data, cover)
})
