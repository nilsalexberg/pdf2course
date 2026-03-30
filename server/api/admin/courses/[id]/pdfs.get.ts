import { serverSupabaseClient } from '#supabase/server'
import type { CoursePdf } from '../../../../../types/course'
import { requireUser } from '../../../../auth/requireUser'
import { requireRole } from '../../../../auth/requireRole'
import { listCoursePdfs } from '../../../../repositories/courseRepo'

export default defineEventHandler(async (event): Promise<CoursePdf[]> => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)

  await requireRole(event, client, user.id, true)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing course ID' })
  }

  return listCoursePdfs(client, id)
})
