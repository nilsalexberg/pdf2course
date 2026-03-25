import { serverSupabaseClient } from '#supabase/server'
import { requireUser } from '../../../auth/requireUser'
import { requireRole } from '../../../auth/requireRole'
import { getLearnStructure } from '../../../services/courses/getLearnStructure'
import type { LearnStructure } from '../../../services/courses/getLearnStructure'

export default defineEventHandler(async (event): Promise<LearnStructure> => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)
  await requireRole(event, client, user.id)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing course ID' })

  return await getLearnStructure(client, id, user.id)
})
