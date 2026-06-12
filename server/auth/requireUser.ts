import type { H3Event } from 'h3';
import { createError } from 'h3';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';

export async function requireUser(event: H3Event) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(event.node.req.headers)
  });
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }
  return session.user;
}
