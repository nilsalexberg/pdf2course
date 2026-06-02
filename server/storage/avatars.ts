import { createError } from 'h3'
import type { MultipartFile } from '../http/multipart'
import { uploadObject } from '../lib/storage'

const BUCKET = 'avatars'
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

export async function uploadAvatar(path: string, file: MultipartFile): Promise<string> {
  await uploadObject(BUCKET, path, Buffer.from(file.data), file.type)
  const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000'
  return `${endpoint}/${BUCKET}/${path}`
}
