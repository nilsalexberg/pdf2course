import { createError } from 'h3'
import type { MultipartFile } from '../http/multipart'
import { CourseCreateLimits } from '../validators/courseSchemas'
import { uploadObject, deleteObject, downloadObject, createPresignedUrl } from '../lib/storage'

const BUCKET = 'course-pdfs'
const ALLOWED_PDF_TYPE = 'application/pdf'

export function buildPdfPath(userId: string, courseId: string, filename: string) {
  const timestamp = Date.now()
  const cleanName = filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase()
  return `${userId}/${courseId}/${timestamp}_${cleanName}`
}

export function validatePdfFile(file: MultipartFile) {
  if (file.type !== ALLOWED_PDF_TYPE && !file.filename.toLowerCase().endsWith('.pdf')) {
    throw createError({
      statusCode: 400,
      statusMessage: `File ${file.filename} is not a PDF`,
    })
  }
  if (file.data.length > CourseCreateLimits.pdfs.maxSizeBytes) {
    throw createError({
      statusCode: 400,
      statusMessage: `PDF ${file.filename} exceeds the 50MB limit`,
    })
  }
}

export async function uploadCoursePdf(path: string, file: MultipartFile): Promise<void> {
  await uploadObject(BUCKET, path, Buffer.from(file.data), ALLOWED_PDF_TYPE)
}

export async function deleteCoursePdf(path: string): Promise<void> {
  await deleteObject(BUCKET, path)
}

export async function createSignedPdfUrl(path: string): Promise<string> {
  return createPresignedUrl(BUCKET, path, 3600)
}

export async function downloadCoursePdf(path: string): Promise<Buffer> {
  return downloadObject(BUCKET, path)
}
