import { z } from 'zod'
import { serverSupabaseClient } from '#supabase/server'
import { requireUser } from '../auth/requireUser'
import { updateProfile } from '../repositories/profileRepo'

const schema = z.object({
  full_name: z.string().min(1, 'Name is required').max(100),
})

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const parsed = schema.parse(body)
  return updateProfile(client, user.id, { full_name: parsed.full_name })
})
