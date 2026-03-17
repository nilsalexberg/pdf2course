import { createError } from 'h3'
import { serverSupabaseUser } from '#supabase/server'

export async function requireUser(event: any) {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}

