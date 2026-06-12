import type { H3Event } from 'h3';
import { getRoleByUserId } from '../repositories/profileRepo';

type Role = string | null;

export async function getProfileRole(event: H3Event, userId: string): Promise<Role> {
  event.context ||= {};
  event.context.auth ||= {};
  if ('role' in event.context.auth) return event.context.auth.role as Role;

  const role = (await getRoleByUserId(userId)) as Role;
  event.context.auth.role = role;
  return role;
}
