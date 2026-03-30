import { serverSupabaseClient } from '#supabase/server'
import { z } from 'zod'
import type { Course } from '../../../../../types/course'
import { requireUser } from '../../../../auth/requireUser'
import { requireRole } from '../../../../auth/requireRole'
import { updateCourseStatus } from '../../../../repositories/courseRepo'

const bodySchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
})

export default defineEventHandler(async (event): Promise<Course> => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)

  await requireRole(event, client, user.id, true)

  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const { reason } = bodySchema.parse(body)

  return updateCourseStatus(client, id, 'rejected', reason)
})
