import { PDFParse } from 'pdf-parse'
import {
  getCourseById,
  listCoursePdfs,
  updateCoursePdfText,
  updateCourseGenerationStatus,
  deleteDocumentChunksByPdfId,
  insertDocumentChunks,
  listDocumentChunksByCourseId,
  batchUpdateDocumentChunkEmbeddings,
  updateCoursePdfAiSummary,
  deleteLessonCompletionsByCourseId,
  deleteCourseModules,
  insertModules,
  insertLessons,
  updateCourseGeneratedAt,
} from '../../repositories/courseRepo'
import { downloadCoursePdf } from '../../storage/coursePdfs'
import { embedBatch, EMBED_BATCH_SIZE } from '../gemini/embedChunks'
import { summarizeDocument } from '../gemini/summarizeDocument'
import { generateCourseStructure, type CourseStructure } from '../gemini/generateCourseStructure'
import { cleanExtractedText, splitIntoChunks } from '../../utils/textProcessing'
import type { Course, CoursePdf } from '../../../types/course'

/**
 * Main function to orchestrate the course generation process.
 * This function handles fetching PDFs, extracting text, and will eventually
 * handle chunking, embedding, and AI generation of the course structure.
 */
export async function processCourseGeneration(courseId: string) {
  try {
    // ─── STEP 1 — Fetch course + PDFs from DB ─────────────────────────────
    const course = await getCourseById(courseId)

    if (!course) {
      throw createError({ statusCode: 404, statusMessage: 'Course not found' })
    }

    const pdfs = await listCoursePdfs(courseId)

    if (pdfs.length === 0) {
      throw new Error(`No PDFs found for course ${courseId}`)
    }

    await updateCourseGenerationStatus(courseId, 'processing')
    console.log(`[course-generation] Course ${courseId} status → processing`)

    // ─── STEP 2 — Download PDFs + extract text ────────────────────────────
    await extractTextFromPdfs(pdfs)

    // ─── STEP 3 — Chunk documents ──────────────────────────────────────────
    const freshPdfs = await listCoursePdfs(courseId)
    await chunkDocuments(courseId, freshPdfs, course)

    // ─── STEP 4 — Generate embeddings ─────────────────────────────────────
    const chunks = await listDocumentChunksByCourseId(courseId)
    await embedDocumentChunks(courseId, chunks)

    // ─── STEP 5 — Summarize documents ─────────────────────────────────────
    const summarizablePdfs = await listCoursePdfs(courseId)
    await summarizeDocuments(courseId, summarizablePdfs)

    // ─── STEP 6 — Generate course structure ───────────────────────────────
    const freshCourse = await getCourseById(courseId)
    if (!freshCourse) {
      throw createError({ statusCode: 404, statusMessage: 'Course not found' })
    }
    const pdfsForStructure = await listCoursePdfs(courseId)
    const structure = await generateCourseStructureStep(courseId, freshCourse, pdfsForStructure)

    // ─── STEP 7 — Persist course structure ────────────────────────────────
    await persistCourseStructure(courseId, structure)

    // ─── STEP 8 — Mark course as ready ────────────────────────────────────
    await updateCourseGeneratedAt(courseId)
    await updateCourseGenerationStatus(courseId, 'ready')
    console.log(`[course-generation] Course ${courseId} status → ready`)
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[course-generation] Failed for course ${courseId}: ${message}`)
    // Best-effort status update so the user is never left with a stuck 'processing' course
    await updateCourseGenerationStatus(courseId, 'failed', message).catch(() => { })
    throw err
  }
}

/**
 * Downloads course PDFs, extracts text using PDFParse, and cleans it.
 */
async function extractTextFromPdfs(pdfs: any[]) {
  for (const pdf of pdfs) {
    // Idempotency: skip PDFs already processed in a previous run
    if (pdf.extracted_text) {
      console.log(`[course-generation] Skipping ${pdf.filename} — text already extracted`)
      continue
    }

    const buffer = await downloadCoursePdf(pdf.file_path)
    const parser = new PDFParse({ data: new Uint8Array(buffer.buffer) })
    const result = await parser.getText()
    await parser.destroy()

    const cleaned = cleanExtractedText(result.text)
    await updateCoursePdfText(pdf.id, cleaned)

    console.log(`[course-generation] Extracted ${cleaned.length} chars from ${pdf.filename}`)
  }
}

/**
 * Splits extracted_text from each PDF into overlapping chunks and persists them.
 * Idempotent: deletes existing chunks for each PDF before re-inserting.
 * Wrapped in a try/catch per PDF so failures are clearly attributed for worker retries.
 */
async function chunkDocuments(courseId: string, pdfs: any[], course: Course) {
  const chunkSize = course.config?.chunk_size
  const chunkOverlap = course.config?.chunk_overlap
  // Fetch all existing chunks for the course to check which PDFs are already fully processed
  const existingChunks = await listDocumentChunksByCourseId(courseId)

  for (const pdf of pdfs) {
    if (!pdf.extracted_text) {
      console.log(`[course-generation] Skipping chunking for ${pdf.filename} — no extracted text`)
      continue
    }

    // Idempotency: Skip if chunks exist AND all have embeddings (indicating a successful previous run)
    const pdfChunks = existingChunks.filter((c) => c.course_pdf_id === pdf.id)
    const isFullyProcessed = pdfChunks.length > 0 && pdfChunks.every((c) => c.embedding)

    if (isFullyProcessed) {
      console.log(`[course-generation] Skipping chunking for ${pdf.filename} — already chunked and embedded`)
      continue
    }

    try {
      // If we reach here, it's either a new PDF or a previous run failed during chunking/embedding.
      // We delete existing chunks (if any) to ensure a clean state before re-inserting.
      await deleteDocumentChunksByPdfId(pdf.id)

      const chunks = splitIntoChunks(pdf.extracted_text, chunkSize, chunkOverlap)
      const rows = chunks.map((content, chunk_index) => ({
        course_id: courseId,
        course_pdf_id: pdf.id,
        chunk_index,
        content,
      }))

      await insertDocumentChunks(rows)
      console.log(`[course-generation] Chunked ${pdf.filename} into ${chunks.length} chunks`)
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(
        `[course-generation] Failed to chunk PDF "${pdf.filename}" (id=${pdf.id}) for course ${courseId}: ${message}`,
      )
      throw err
    }
  }
}

/**
 * Generates and stores embeddings for all document chunks of a course.
 * Processes chunks in batches of EMBED_BATCH_SIZE to stay within API rate limits.
 * Idempotent: chunks that already have an embedding are skipped.
 */
async function embedDocumentChunks(
  courseId: string,
  chunks: Array<{ id: string; content: string; embedding: number[] | null }>,
) {
  await updateCourseGenerationStatus(courseId, 'embedding')
  console.log(`[course-generation] Course ${courseId} status → embedding`)

  const pending = chunks.filter((c) => !c.embedding)

  if (pending.length === 0) {
    console.log(`[course-generation] All chunks already embedded for course ${courseId}`)
    return
  }

  let embeddedCount = 0

  for (let i = 0; i < pending.length; i += EMBED_BATCH_SIZE) {
    const batch = pending.slice(i, i + EMBED_BATCH_SIZE)
    const vectors = await embedBatch(batch.map((c) => c.content))
    const updates = batch.map((chunk, j) => ({ id: chunk.id, embedding: vectors[j] as number[] }))
    await batchUpdateDocumentChunkEmbeddings(updates)
    embeddedCount += batch.length
    console.log(`[course-generation] Embedded ${embeddedCount}/${pending.length} chunks for course ${courseId}`)
  }
}

/**
 * Calls Gemini to produce the course module/lesson structure, then validates it.
 * Updates course status to 'generating_structure' before the API call.
 */
async function generateCourseStructureStep(
  courseId: string,
  course: Course,
  pdfs: CoursePdf[],
) {
  await updateCourseGenerationStatus(courseId, 'generating_structure')
  console.log(`[course-generation] Course ${courseId} status → generating_structure`)

  const structure = await generateCourseStructure(course, pdfs)
  console.log(
    `[course-generation] Structure generated for course ${courseId}: ${structure.modules.length} modules`,
  )
  return structure
}

/**
 * Persists the generated course structure to the database.
 * Inserts all modules first, then inserts all lessons for each module.
 */
async function persistCourseStructure(
  courseId: string,
  structure: CourseStructure,
) {
  // Idempotency: wipe all user progress and course structure from any previous run.
  // Order matters: completions reference lessons, so delete them before modules cascade-deletes lessons.
  await deleteLessonCompletionsByCourseId(courseId)
  await deleteCourseModules(courseId)

  const moduleRows = structure.modules.map((m) => ({
    course_id: courseId,
    module_number: m.module_number,
    title: m.title,
    description: m.description,
  }))

  const insertedModules = await insertModules(moduleRows)
  console.log(`[course-generation] Persisted ${insertedModules.length} modules for course ${courseId}`)

  const lessonRows = structure.modules.flatMap((m) => {
    const dbModule = insertedModules.find((dbm) => dbm.module_number === m.module_number)
    if (!dbModule) {
      throw new Error(`Could not find inserted module for module_number ${m.module_number}`)
    }
    return m.lessons.map((l) => ({
      module_id: dbModule.id,
      course_id: courseId,
      lesson_number: l.lesson_number,
      title: l.title,
      description: l.description,
      learning_objectives: l.learning_objectives,
      key_topics: l.key_topics,
    }))
  })

  await insertLessons(lessonRows)
  console.log(`[course-generation] Persisted ${lessonRows.length} lessons for course ${courseId}`)
}

/**
 * Generates a structured knowledge taxonomy (ai_summary) for each PDF using Gemini.
 * Idempotent: skips PDFs that already have an ai_summary from a previous run.
 */
async function summarizeDocuments(courseId: string, pdfs: any[]) {
  await updateCourseGenerationStatus(courseId, 'summarizing')
  console.log(`[course-generation] Course ${courseId} status → summarizing`)

  for (const pdf of pdfs) {
    if (pdf.ai_summary) {
      console.log(`[course-generation] Skipping ${pdf.filename} — already summarized`)
      continue
    }

    if (!pdf.extracted_text) {
      console.log(`[course-generation] Skipping ${pdf.filename} — no extracted text`)
      continue
    }

    const summary = await summarizeDocument(pdf.extracted_text)
    await updateCoursePdfAiSummary(pdf.id, summary)
    console.log(`[course-generation] Summarized ${pdf.filename} → ${summary.structural_outline.length} topics`)
  }
}
