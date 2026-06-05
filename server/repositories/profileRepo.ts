import { createError } from 'h3';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { profiles } from '../db/schema';
import type { Profile, UserRole } from '../../types/profile';

export async function getRoleByUserId(userId: string): Promise<UserRole | null> {
  const result = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return result[0]?.role ?? null;
}

export async function updateProfile(
  userId: string,
  data: { full_name?: string; avatar_url?: string }
): Promise<Profile> {
  const update: Record<string, unknown> = {};
  if (data.full_name !== undefined) update.fullName = data.full_name;
  if (data.avatar_url !== undefined) update.avatarUrl = data.avatar_url;
  update.updatedAt = new Date();

  const result = await db.update(profiles).set(update).where(eq(profiles.id, userId)).returning();
  if (!result[0]) {
    throw createError({ statusCode: 500, statusMessage: 'Profile update failed' });
  }
  return result[0];
}

export async function getProfileById(userId: string): Promise<Profile | null> {
  const result = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  if (!result[0]) return null;
  return result[0];
}
