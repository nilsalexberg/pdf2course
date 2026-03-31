import { createError } from 'h3'
import type { MultipartFile } from '../http/multipart'

const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function buildAvatarPath(userId: string, originalFilename: string) {
  const ext = originalFilename.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpeg', 'jpg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
  return `${userId}/avatar.${safeExt}`
}

export function validateAvatarFile(file: MultipartFile) {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type as any)) {
    throw createError({ statusCode: 400, statusMessage: 'Avatar must be image/jpeg, image/png, or image/webp' })
  }
  if (file.data.length > AVATAR_MAX_SIZE_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Avatar image must be at most 5MB' })
  }
}

export async function uploadAvatar(client: any, path: string, file: MultipartFile): Promise<string> {
  const { error } = await client.storage.from('avatars').upload(path, file.data, {
    contentType: file.type,
    upsert: true,
  })
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  const { data } = client.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
