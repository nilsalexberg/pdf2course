import { getProfileRole } from './getProfileRole'
import { createError } from 'h3'

export async function requireRole(event: any, client: any, userId: string, allowed: string[]) {
  const role = await getProfileRole(event, client, userId)
  if (!role || !allowed.includes(role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return role
}

