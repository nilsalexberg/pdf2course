import { createError } from 'h3';
import type { MultipartFile } from '../http/multipart';
import { uploadObject, deleteObject, createPresignedUrl } from '../lib/storage';

const BUCKET = 'course-covers';
const COVER_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_COVER_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export function buildCoverPath(userId: string, courseId: string, originalFilename: string) {
  const ext = originalFilename.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpeg', 'jpg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  return `${userId}/${courseId}/cover.${safeExt}`;
}

export function validateCoverFile(file: MultipartFile) {
  if (!(ALLOWED_COVER_TYPES as readonly string[]).includes(file.type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cover must be image/jpeg, image/png, or image/webp'
    });
  }
  if (file.data.length > COVER_MAX_SIZE_BYTES) {
    throw createError({ statusCode: 400, statusMessage: 'Cover image must be at most 5MB' });
  }
}

export async function uploadCourseCover(path: string, file: MultipartFile): Promise<void> {
  signedUrlCache.delete(path);
  await uploadObject(BUCKET, path, Buffer.from(file.data), file.type);
}

const SAFETY_MARGIN_SEC = 300;
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export async function createSignedCoverUrl(
  path: string,
  expiresSec: number
): Promise<string | null> {
  const now = Date.now();
  const cached = signedUrlCache.get(path);
  if (cached && cached.expiresAt > now) return cached.url;
  signedUrlCache.delete(path);

  const url = await createPresignedUrl(BUCKET, path, expiresSec);
  signedUrlCache.set(path, { url, expiresAt: now + (expiresSec - SAFETY_MARGIN_SEC) * 1000 });
  return url;
}

export async function deleteCourseCover(path: string): Promise<void> {
  await deleteObject(BUCKET, path);
}
