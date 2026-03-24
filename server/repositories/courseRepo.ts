import { createError } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Course, CoursePdf, DocumentChunk, GenerationStatus } from '../../types/course'

export async function listCoursesByProducerId(client: SupabaseClient, producerId: string): Promise<Course[]> {
  const { data: courses, error } = await client
    .from('courses')
    .select('*')
    .eq('producer_id', producerId)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return (courses ?? []) as Course[]
}

export async function insertCourse(
  client: SupabaseClient,
  input: { producer_id: string; title: string; description: string | null; cover_url: string | null; config: any },
): Promise<Course> {
  const { data: course, error } = await client
    .from('courses')
    .insert(input)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return course as Course
}

export async function updateCourseCoverUrl(client: SupabaseClient, courseId: string, coverUrl: string | null): Promise<void> {
  const { error } = await client.from('courses').update({ cover_url: coverUrl }).eq('id', courseId)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

export async function getCourseById(client: SupabaseClient, id: string): Promise<Course> {
  const { data: course, error } = await client
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw createError({ statusCode: 404, statusMessage: 'Course not found' })
  }

  return course as Course
}

export async function updateCourse(
  client: SupabaseClient,
  id: string,
  input: { title: string; description: string | null; config: any },
): Promise<Course> {
  const { data: course, error } = await client
    .from('courses')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return course as Course
}

export async function deleteCourse(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('courses').delete().eq('id', id)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

export async function insertCoursePdf(
  client: SupabaseClient,
  input: { course_id: string; file_path: string; filename: string; size_bytes: number },
): Promise<void> {
  const { error } = await client.from('course_pdfs').insert(input)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

export async function listCoursePdfs(client: SupabaseClient, courseId: string): Promise<CoursePdf[]> {
  const { data, error } = await client
    .from('course_pdfs')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return (data ?? []) as CoursePdf[]
}

export async function getCoursePdfById(client: SupabaseClient, pdfId: string): Promise<CoursePdf> {
  const { data, error } = await client.from('course_pdfs').select('*').eq('id', pdfId).single()

  if (error) {
    throw createError({ statusCode: 404, statusMessage: 'PDF not found' })
  }

  return data as CoursePdf
}

export async function deleteCoursePdfFromDb(client: SupabaseClient, pdfId: string): Promise<void> {
  const { error } = await client.from('course_pdfs').delete().eq('id', pdfId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

export async function updateCoursePdfText(client: SupabaseClient, pdfId: string, extractedText: string): Promise<void> {
  const { error } = await client
    .from('course_pdfs')
    .update({ extracted_text: extractedText })
    .eq('id', pdfId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

export async function deleteDocumentChunksByPdfId(client: SupabaseClient, coursePdfId: string): Promise<void> {
  const { error } = await client.from('document_chunks').delete().eq('course_pdf_id', coursePdfId)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

const CHUNK_INSERT_BATCH_SIZE = 100

export async function insertDocumentChunks(
  client: SupabaseClient,
  chunks: Array<{ course_id: string; course_pdf_id: string; chunk_index: number; content: string }>,
): Promise<void> {
  if (chunks.length === 0) return
  for (let i = 0; i < chunks.length; i += CHUNK_INSERT_BATCH_SIZE) {
    const batch = chunks.slice(i, i + CHUNK_INSERT_BATCH_SIZE)
    const { error } = await client.from('document_chunks').insert(batch)
    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Batch insert failed at chunk offset ${i}: ${error.message}`,
      })
    }
  }
}

export async function listDocumentChunksByCourseId(
  client: SupabaseClient,
  courseId: string,
): Promise<DocumentChunk[]> {
  const { data, error } = await client
    .from('document_chunks')
    .select('*')
    .eq('course_id', courseId)
    .order('chunk_index', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return (data ?? []) as DocumentChunk[]
}

/**
 * Persists embedding vectors for the given chunks, one row at a time.
 * Sequential execution avoids saturating the Supabase connection pool when
 * callers pass a large batch. Throws immediately on the first DB error so the
 * caller always knows which chunk caused the failure.
 */
export async function batchUpdateDocumentChunkEmbeddings(
  client: SupabaseClient,
  updates: Array<{ id: string; embedding: number[] }>,
): Promise<void> {
  for (const { id, embedding } of updates) {
    const { error } = await client.from('document_chunks').update({ embedding }).eq('id', id)
    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Embedding update failed for chunk ${id}: ${error.message}`,
      })
    }
  }
}

export async function updateCourseGenerationStatus(
  client: SupabaseClient,
  courseId: string,
  generationStatus: GenerationStatus,
  generationError: string | null = null,
): Promise<Course> {
  const { data: course, error } = await client
    .from('courses')
    .update({ generation_status: generationStatus, generation_error: generationError })
    .eq('id', courseId)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return course as Course
}
