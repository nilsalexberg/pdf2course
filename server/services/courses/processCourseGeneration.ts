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
} from '../../repositories/courseRepo'
import { embedBatch, EMBED_BATCH_SIZE } from '../gemini/embedChunks'

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
    // - Update course status → 'summarizing'
    // - For each document:
    //     · send full extracted_text to Gemini 2.5 Flash
    //     · prompt: given the text, return a structured summary
    //     · store result in `documents.ai_summary`
    // - Combine all document summaries into a single string
    // - Send combined summaries to Gemini 2.5 Flash for course-level synthesis

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

// Target character count per chunk (~300 tokens at ~4 chars/token)
const TARGET_CHUNK_SIZE = 1200
// Characters from the end of each chunk carried into the start of the next
const CHUNK_OVERLAP = 200
// Hard cap per sentence to guard against malformed PDFs with no punctuation
const MAX_SENTENCE_SIZE = TARGET_CHUNK_SIZE

/**
 * Splits extracted_text from each PDF into overlapping chunks and persists them.
 * Idempotent: deletes existing chunks for each PDF before re-inserting.
 * Wrapped in a try/catch per PDF so failures are clearly attributed for worker retries.
 */
async function chunkDocuments(adminClient: SupabaseClient, courseId: string, pdfs: any[]) {
  for (const pdf of pdfs) {
    if (!pdf.extracted_text) {
      console.log(`[course-generation] Skipping chunking for ${pdf.filename} — no extracted text`)
      continue
    }

    try {
      // Idempotency: replace any chunks from a previous run
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
 * Returns the trailing ~CHUNK_OVERLAP characters of a chunk, starting at a word
 * boundary so the overlap never begins mid-word.
 */
function getOverlapSuffix(text: string): string {
  if (text.length <= CHUNK_OVERLAP) return text
  const tail = text.slice(-CHUNK_OVERLAP)
  const firstSpace = tail.indexOf(' ')
  return firstSpace === -1 ? tail : tail.slice(firstSpace + 1)
}

/**
 * Splits text into chunks with overlap, preferring paragraph breaks over sentence
 * breaks. Giant sentences from malformed PDFs are hard-capped at MAX_SENTENCE_SIZE
 * to prevent oversized payloads reaching the vector DB.
 */
export function splitIntoChunks(text: string): string[] {
  const paragraphs = text.split(/\n\n+/)
  const chunks: string[] = []
  let current = ''

  // Finalise the current accumulator: push it, then seed the next with an overlap suffix
  const pushChunk = (): void => {
    const trimmed = current.trim()
    if (!trimmed) return
    chunks.push(trimmed)
    current = getOverlapSuffix(trimmed)
  }

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) continue

    // Paragraph too large on its own — split by sentence
    if (trimmed.length > TARGET_CHUNK_SIZE) {
      if (current) pushChunk()

      const sentences = trimmed
        .split(/(?<=[.!?])\s+/)
        // Hard-cap sentences that lack punctuation (e.g. tables/headers run together)
        .flatMap((s) => {
          if (s.length <= MAX_SENTENCE_SIZE) return [s]
          // Slice at word boundary every MAX_SENTENCE_SIZE chars
          const parts: string[] = []
          let remaining = s
          while (remaining.length > MAX_SENTENCE_SIZE) {
            const slice = remaining.slice(0, MAX_SENTENCE_SIZE)
            const lastSpace = slice.lastIndexOf(' ')
            const cutAt = lastSpace > 0 ? lastSpace : MAX_SENTENCE_SIZE
            parts.push(remaining.slice(0, cutAt).trim())
            remaining = remaining.slice(cutAt).trim()
          }
          if (remaining) parts.push(remaining)
          return parts
        })

      for (const sentence of sentences) {
        if (!sentence) continue
        if (current && current.length + 1 + sentence.length > TARGET_CHUNK_SIZE) {
          pushChunk()
        }
        current = current ? `${current} ${sentence}` : sentence
      }
      continue
    }

    // Would appending this paragraph exceed the target?
    if (current && current.length + 2 + trimmed.length > TARGET_CHUNK_SIZE) {
      pushChunk()
      current = current ? `${current}\n\n${trimmed}` : trimmed
    } else {
      current = current ? `${current}\n\n${trimmed}` : trimmed
    }
  }

  if (current.trim()) {
    chunks.push(current.trim())
  }

  return chunks
}

/**
 * Cleans the extracted text by removing non-printable characters, collapsing white space,
 * and filtering out common headers/footers based on line frequency.
 */
export function cleanExtractedText(raw: string): string {
  const lines = raw
    // Remove non-printable characters (keep newlines, tabs, and printable ASCII)
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    // Collapse multiple spaces/tabs on the same line into a single space
    .replace(/[ \t]+/g, ' ')
    // Collapse 3+ consecutive newlines into 2
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')

  // O(N) pass: count frequency of short lines (≤ 6 words) to detect headers/footers
  const shortLineFreq = new Map<string, number>()
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length === 0) continue
    if (trimmed.split(/\s+/).length > 6) continue
    shortLineFreq.set(trimmed, (shortLineFreq.get(trimmed) ?? 0) + 1)
  }

  return lines
    .filter((line) => {
      const trimmed = line.trim()
      if (trimmed.length === 0) return true // keep blank lines for paragraph structure
      if (trimmed.split(/\s+/).length > 6) return true // long line, keep it
      return (shortLineFreq.get(trimmed) ?? 0) < 3 // drop repeated headers/footers
    })
    .join('\n')
    .trim()
}
