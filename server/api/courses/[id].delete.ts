import { serverSupabaseClient } from '#supabase/server'
import { requireRole } from '../../auth/requireRole'
import { requireUser } from '../../auth/requireUser'
import { deleteCourse } from '../../services/courses/deleteCourse'

export default defineEventHandler(async (event): Promise<{ success: boolean }> => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)

  await requireRole(event, client, user.id)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course ID' })
  }

  await deleteCourse(client, user.id, id)
  
  return { success: true }
})
