import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { profiles } from '../db/schema'

export async function getRoleByUserId(userId: string): Promise<string | null> {
  const result = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, userId)).limit(1)
  return result[0]?.role ?? null
}

export async function updateProfile(userId: string, data: { full_name?: string; avatar_url?: string }) {
  const update: Record<string, unknown> = {}
  if (data.full_name !== undefined) update.fullName = data.full_name
  if (data.avatar_url !== undefined) update.avatarUrl = data.avatar_url
  update.updatedAt = new Date()

  const result = await db.update(profiles).set(update).where(eq(profiles.id, userId)).returning()
  if (!result[0]) {
    throw createError({ statusCode: 500, statusMessage: 'Profile update failed' })
  }
  return result[0]
}

export async function getProfileById(userId: string) {
  const result = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1)
  if (!result[0]) return null
  return result[0]
}
