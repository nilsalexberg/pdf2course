import { PDFParse } from 'pdf-parse'
import type { SupabaseClient } from '@supabase/supabase-js'
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
} from '../../repositories/courseRepo'
import { embedBatch, EMBED_BATCH_SIZE } from '../gemini/embedChunks'
import { summarizeDocument } from '../gemini/summarizeDocument'
import { cleanExtractedText, splitIntoChunks } from '../../utils/textProcessing'

/**
 * Main function to orchestrate the course generation process.
 * This function handles fetching PDFs, extracting text, and will eventually
 * handle chunking, embedding, and AI generation of the course structure.
 */
export async function processCourseGeneration(courseId: string, adminClient: SupabaseClient) {
  try {
    // ─── STEP 1 — Fetch course + PDFs from DB ─────────────────────────────
    const course = await getCourseById(adminClient, courseId)
    const pdfs = await listCoursePdfs(adminClient, courseId)

    if (pdfs.length === 0) {
      throw new Error(`No PDFs found for course ${courseId}`)
    }

    await updateCourseGenerationStatus(adminClient, courseId, 'processing')
    console.log(`[course-generation] Course ${courseId} status → processing`)

    // ─── STEP 2 — Download PDFs + extract text ────────────────────────────
    await extractTextFromPdfs(adminClient, courseId, pdfs)

    // ─── STEP 3 — Chunk documents ──────────────────────────────────────────
    const freshPdfs = await listCoursePdfs(adminClient, courseId)
    await chunkDocuments(adminClient, courseId, freshPdfs)

    // ─── STEP 4 — Generate embeddings ─────────────────────────────────────
    const chunks = await listDocumentChunksByCourseId(adminClient, courseId)
    await embedDocumentChunks(adminClient, courseId, chunks)

    // ─── STEP 5 — Summarize documents ─────────────────────────────────────
    const summarizablePdfs = await listCoursePdfs(adminClient, courseId)
    await summarizeDocuments(adminClient, courseId, summarizablePdfs)

    // ─── STEP 6 — Generate course structure ───────────────────────────────
    // - Update course status → 'generating_structure'
    // - Build prompt with:
    //     · course title and description (from course row)
    //     · config: { num_modules, lessons_per_module } (from course row)
    //     · course-level ai_summary (key_topics, themes, estimated_difficulty)
    // - Send to Gemini 2.5 Flash, request JSON with modules and lessons per module
    // - Validate that number of modules and lessons matches config

    // ─── STEP 7 — Persist course structure ────────────────────────────────
    // - Insert all modules into `modules` table (course_id, title, description, order)
    // - For each module, insert its lessons into `lessons` table
    //     · status = 'not_generated'  (content blocks generated later, on demand)

    // ─── STEP 8 — Mark course as ready ────────────────────────────────────
    // - Update course status → 'ready'
    // - Update course.generated_at = now()
    // - Log completion: job id, course id, total duration
  }
  catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[course-generation] Failed for course ${courseId}: ${message}`)
    // Best-effort status update so the user is never left with a stuck 'processing' course
    await updateCourseGenerationStatus(adminClient, courseId, 'failed', message).catch(() => { })
    throw err
  }
}

/**
 * Downloads course PDFs, extracts text using PDFParse, and cleans it.
 */
async function extractTextFromPdfs(adminClient: SupabaseClient, courseId: string, pdfs: any[]) {
  for (const pdf of pdfs) {
    // Idempotency: skip PDFs already processed in a previous run
    if (pdf.extracted_text) {
      console.log(`[course-generation] Skipping ${pdf.filename} — text already extracted`)
      continue
    }

    const { data: blob, error: downloadError } = await adminClient.storage
      .from('course-pdfs')
      .download(pdf.file_path)

    if (downloadError || !blob) {
      throw new Error(`Failed to download PDF ${pdf.filename}: ${downloadError?.message}`)
    }

    const arrayBuffer = await blob.arrayBuffer()
    const parser = new PDFParse({ data: arrayBuffer })
    const result = await parser.getText()
    await parser.destroy()

    const cleaned = cleanExtractedText(result.text)
    await updateCoursePdfText(adminClient, pdf.id, cleaned)

    console.log(`[course-generation] Extracted ${cleaned.length} chars from ${pdf.filename}`)
  }
}

/**
 * Splits extracted_text from each PDF into overlapping chunks and persists them.
 * Idempotent: deletes existing chunks for each PDF before re-inserting.
 * Wrapped in a try/catch per PDF so failures are clearly attributed for worker retries.
 */
async function chunkDocuments(adminClient: SupabaseClient, courseId: string, pdfs: any[]) {
  // Fetch all existing chunks for the course to check which PDFs are already fully processed
  const existingChunks = await listDocumentChunksByCourseId(adminClient, courseId)

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
      await deleteDocumentChunksByPdfId(adminClient, pdf.id)

      const chunks = splitIntoChunks(pdf.extracted_text)
      const rows = chunks.map((content, chunk_index) => ({
        course_id: courseId,
        course_pdf_id: pdf.id,
        chunk_index,
        content,
      }))

      await insertDocumentChunks(adminClient, rows)
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
  adminClient: SupabaseClient,
  courseId: string,
  chunks: Array<{ id: string; content: string; embedding: number[] | null }>,
) {
  await updateCourseGenerationStatus(adminClient, courseId, 'embedding')
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
    await batchUpdateDocumentChunkEmbeddings(adminClient, updates)
    embeddedCount += batch.length
    console.log(`[course-generation] Embedded ${embeddedCount}/${pending.length} chunks for course ${courseId}`)
  }
}

/**
 * Generates a structured knowledge taxonomy (ai_summary) for each PDF using Gemini.
 * Idempotent: skips PDFs that already have an ai_summary from a previous run.
 */
async function summarizeDocuments(adminClient: SupabaseClient, courseId: string, pdfs: any[]) {
  await updateCourseGenerationStatus(adminClient, courseId, 'summarizing')
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
    await updateCoursePdfAiSummary(adminClient, pdf.id, summary)
    console.log(`[course-generation] Summarized ${pdf.filename} → ${summary.structural_outline.length} topics`)
  }
}
