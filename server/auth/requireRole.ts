import { getProfileRole } from './getProfileRole'
import { createError } from 'h3'

export async function requireRole(event: any, userId: string, isAdminOnly: boolean = false) {
  const role = await getProfileRole(event, userId)

  if (role === null) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  if (isAdminOnly && role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return role
}

