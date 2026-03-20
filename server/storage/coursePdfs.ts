import { createError } from 'h3'
import type { MultipartFile } from '../http/multipart'
import { CourseCreateLimits } from '../validators/courseSchemas'

const ALLOWED_PDF_TYPE = 'application/pdf'

export function buildPdfPath(userId: string, courseId: string, filename: string) {
  // Use a clean filename or a random string to prevent issues with special characters
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

export async function uploadCoursePdf(client: any, path: string, file: MultipartFile) {
  const { error } = await client.storage.from('course-pdfs').upload(path, file.data, {
    contentType: ALLOWED_PDF_TYPE,
    upsert: true,
  })
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

export async function deleteCoursePdf(client: any, path: string) {
  const { error } = await client.storage.from('course-pdfs').remove([path])
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}
