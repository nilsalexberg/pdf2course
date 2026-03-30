import { createError } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Course, CoursePdf, DocumentChunk, DocumentSummary, GenerationStatus, LessonCompletion, LessonContent, LessonStatus, Module, Lesson, ModuleWithLessons } from '../../types/course'
import { emitGenerationStatus } from '../utils/generationEvents'

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

export async function updateCoursePdfAiSummary(
  client: SupabaseClient,
  pdfId: string,
  aiSummary: DocumentSummary,
): Promise<void> {
  const { error } = await client
    .from('course_pdfs')
    .update({ ai_summary: aiSummary })
    .eq('id', pdfId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

export async function deleteCourseModules(client: SupabaseClient, courseId: string): Promise<void> {
  const { error } = await client.from('modules').delete().eq('course_id', courseId)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

export async function insertModules(
  client: SupabaseClient,
  modules: Array<{ course_id: string; module_number: number; title: string; description: string }>,
): Promise<Module[]> {
  const { data, error } = await client.from('modules').insert(modules).select()
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
  return (data ?? []) as Module[]
}

export async function insertLessons(
  client: SupabaseClient,
  lessons: Array<{
    module_id: string
    course_id: string
    lesson_number: number
    title: string
    description: string
    learning_objectives: string[]
    key_topics: string[]
  }>,
): Promise<void> {
  if (lessons.length === 0) return
  const { error } = await client.from('lessons').insert(lessons)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

export async function updateCourseGeneratedAt(client: SupabaseClient, courseId: string): Promise<void> {
  const { error } = await client
    .from('courses')
    .update({ generated_at: new Date().toISOString() })
    .eq('id', courseId)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

export async function listModulesWithLessons(
  client: SupabaseClient,
  courseId: string,
): Promise<ModuleWithLessons[]> {
  const [{ data: mods, error: modErr }, { data: less, error: lesErr }] = await Promise.all([
    client.from('modules').select('*').eq('course_id', courseId).order('module_number', { ascending: true }),
    client.from('lessons').select('*').eq('course_id', courseId).order('lesson_number', { ascending: true }),
  ])

  if (modErr) throw createError({ statusCode: 500, statusMessage: modErr.message })
  if (lesErr) throw createError({ statusCode: 500, statusMessage: lesErr.message })

  const lessonMap = new Map<string, Lesson[]>()
  for (const l of less ?? []) {
    const arr = lessonMap.get(l.module_id) ?? []
    arr.push(l as Lesson)
    lessonMap.set(l.module_id, arr)
  }

  return (mods ?? []).map(m => ({
    ...(m as Module),
    lessons: lessonMap.get(m.id) ?? [],
  }))
}

export async function updateModule(
  client: SupabaseClient,
  moduleId: string,
  input: { title: string; description: string },
): Promise<Module> {
  const { data, error } = await client
    .from('modules')
    .update(input)
    .eq('id', moduleId)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data as Module
}

export async function updateLesson(
  client: SupabaseClient,
  lessonId: string,
  input: { title: string; description: string; learning_objectives: string[]; key_topics: string[] },
): Promise<Lesson> {
  const { data, error } = await client
    .from('lessons')
    .update(input)
    .eq('id', lessonId)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data as Lesson
}

export async function getLessonById(client: SupabaseClient, lessonId: string): Promise<Lesson> {
  const { data, error } = await client
    .from('lessons')
    .select('*')
    .eq('id', lessonId)
    .single()

  if (error) {
    throw createError({ statusCode: 404, statusMessage: 'Lesson not found' })
  }

  return data as Lesson
}

export async function updateLessonStatus(
  client: SupabaseClient,
  lessonId: string,
  status: LessonStatus,
  generationError: string | null = null,
): Promise<void> {
  const { error } = await client
    .from('lessons')
    .update({ status, generation_error: generationError })
    .eq('id', lessonId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

export async function updateLessonContent(
  client: SupabaseClient,
  lessonId: string,
  content: LessonContent,
): Promise<Lesson> {
  const { data, error } = await client
    .from('lessons')
    .update({ content, status: 'ready', generation_error: null })
    .eq('id', lessonId)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data as Lesson
}

export async function semanticSearchChunks(
  client: SupabaseClient,
  courseId: string,
  queryEmbedding: number[],
  matchCount: number = 5,
): Promise<Array<{ id: string; content: string; similarity: number }>> {
  const { data, error } = await client.rpc('match_document_chunks', {
    p_course_id: courseId,
    p_query_embedding: queryEmbedding,
    p_match_count: matchCount,
  })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Semantic search failed: ${error.message}` })
  }

  return (data ?? []) as Array<{ id: string; content: string; similarity: number }>
}

export async function listLessonCompletionsByCourse(
  client: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<LessonCompletion[]> {
  const { data, error } = await client
    .from('lesson_completions')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return (data ?? []) as LessonCompletion[]
}

export async function upsertLessonCompletion(
  client: SupabaseClient,
  input: { user_id: string; lesson_id: string; course_id: string; score_percent: number },
): Promise<LessonCompletion> {
  const { data, error } = await client
    .from('lesson_completions')
    .upsert(
      { ...input, completed_at: new Date().toISOString() },
      { onConflict: 'user_id,lesson_id' },
    )
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data as LessonCompletion
}

export async function listAllCourses(client: SupabaseClient): Promise<Course[]> {
  const { data: courses, error } = await client
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return (courses ?? []) as Course[]
}

export async function updateCourseStatus(
  client: SupabaseClient,
  courseId: string,
  status: import('../../types/course').CourseStatus,
  rejectionReason?: string | null,
): Promise<Course> {
  const update: Record<string, unknown> = { status }
  if (rejectionReason !== undefined) {
    update.rejection_reason = rejectionReason
  }

  const { data: course, error } = await client
    .from('courses')
    .update(update)
    .eq('id', courseId)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return course as Course
}

export async function listPublicCourses(
  client: SupabaseClient,
  opts: { search?: string; limit: number; offset: number },
): Promise<{ courses: Course[]; total: number }> {
  let query = client
    .from('courses')
    .select('*', { count: 'exact' })
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(opts.offset, opts.offset + opts.limit - 1)

  if (opts.search) {
    query = query.ilike('title', `%${opts.search}%`)
  }

  const { data, error, count } = await query

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { courses: (data ?? []) as Course[], total: count ?? 0 }
}

export async function deleteLessonCompletionsByCourseId(client: SupabaseClient, courseId: string): Promise<void> {
  const { error } = await client.from('lesson_completions').delete().eq('course_id', courseId)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
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

  emitGenerationStatus(courseId, generationStatus, generationError)

  return course as Course
}
