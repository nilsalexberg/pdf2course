import { createError, getHeaders } from 'h3'
import { auth } from '../lib/auth'
import { fromNodeHeaders } from 'better-auth/node'

export async function requireUser(event: any) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(event.node.req.headers),
  })
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return session.user
}
