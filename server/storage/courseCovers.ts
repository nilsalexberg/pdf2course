import { createError } from 'h3'
import type { MultipartFile } from '../http/multipart'

const COVER_MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export function buildCoverPath(userId: string, courseId: string, originalFilename: string) {
  const ext = originalFilename.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpeg', 'jpg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
  return `${userId}/${courseId}/cover.${safeExt}`
}

export function validateCoverFile(file: MultipartFile) {
  if (!ALLOWED_COVER_TYPES.includes(file.type as any)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cover must be image/jpeg, image/png, or image/webp',
    })
  }
  if (file.data.length > COVER_MAX_SIZE_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Cover image must be at most 5MB' })
  }
}

export async function uploadCourseCover(client: any, path: string, file: MultipartFile) {
  const { error } = await client.storage.from('course-covers').upload(path, file.data, {
    contentType: file.type,
    upsert: true,
  })
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

export async function createSignedCoverUrl(client: any, path: string, expiresSec: number) {
  const { data, error } = await client.storage.from('course-covers').createSignedUrl(path, expiresSec)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  return data?.signedUrl ?? null
}

