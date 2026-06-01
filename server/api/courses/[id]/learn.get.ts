import { requireRole } from '../../../auth/requireRole'
import { requireUser } from '../../../auth/requireUser'
import { getLearnStructure } from '../../../services/courses/getLearnStructure'
import type { LearnStructure } from '../../../services/courses/getLearnStructure'

export default defineEventHandler(async (event): Promise<LearnStructure> => {
  const user = await requireUser(event)
  await requireRole(event, user.id)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing course ID' })

  return getLearnStructure(id, user.id)
})
