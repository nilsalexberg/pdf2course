import { auth } from '../lib/auth'
import { fromNodeHeaders } from 'better-auth/node'
import { getProfileById } from '../repositories/profileRepo'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(event.node.req.headers) })
  if (!session) {
    return {
      user: null,
      profile: null
    }
  }

  const profile = await getProfileById(session.user.id)
  return {
    user: session.user,
    profile,
  }
})
