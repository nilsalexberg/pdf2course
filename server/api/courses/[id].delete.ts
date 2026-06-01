import { requireRole } from '../../auth/requireRole'
import { requireUser } from '../../auth/requireUser'
import { deleteCourse } from '../../services/courses/deleteCourse'

export default defineEventHandler(async (event): Promise<{ success: boolean }> => {
  const user = await requireUser(event)
  await requireRole(event, user.id)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course ID' })
  }

  await deleteCourse(user.id, id)
  return { success: true }
})
