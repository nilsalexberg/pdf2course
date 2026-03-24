import { Worker } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { PDFParse } from 'pdf-parse'
import { COURSE_GENERATION_QUEUE, type CourseGenerationJobData } from '../queues/courseGenerationQueue'
import {
  getCourseById,
  listCoursePdfs,
  updateCoursePdfText,
  updateCourseGenerationStatus,
} from '../repositories/courseRepo'

export function createCourseGenerationWorker() {
  const { redisUrl, supabaseServiceKey, public: { supabaseUrl } } = useRuntimeConfig()

  return new Worker<CourseGenerationJobData>(
    COURSE_GENERATION_QUEUE,
    async (job) => {
      const { courseId } = job.data
      console.log(`[course-generation] Processing job ${job.id} for course ${courseId}`)

      const adminClient = createClient(supabaseUrl as string, supabaseServiceKey as string)

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

        // ─── STEP 3 — Chunk documents ──────────────────────────────────────────
        // - For each document, split extracted_text into chunks:
        //     · target size: ~750 tokens (~3000 characters)
        //     · overlap: ~100 tokens (~400 characters) between consecutive chunks
        //     · prefer splitting on paragraph breaks (\n\n) over mid-sentence
        // - Insert all chunks into `document_chunks` table:
        //     · document_id, course_id, content, order_index

        // ─── STEP 4 — Generate embeddings ─────────────────────────────────────
        // - Update course status → 'embedding'
        // - For each chunk, generate embedding vector using Gemini text-embedding-004
        // - Batch requests (max 100 chunks per API call) to avoid rate limits
        // - Store embedding in `document_chunks.embedding` (pgvector column)

        // ─── STEP 5 — Summarize documents ─────────────────────────────────────
        // - Update course status → 'summarizing'
        // - For each document:
        //     · send full extracted_text to Gemini 2.5 Flash
        //     · prompt: given the text, return a concise summary (max 500 words)
        //       focused on key concepts, themes, and educational value
        //     · store result in `documents.ai_summary`
        // - Combine all document summaries into a single string
        // - Send combined summaries to Gemini 2.5 Flash for course-level synthesis

        // ─── STEP 6 — Generate course structure ───────────────────────────────
        // - Update course status → 'generating_structure'
        // - Build prompt with:
        //     · course title and description (from course row)
        //     · config: { num_modules, lessons_per_module } (from course row)
        //     · course-level ai_summary (key_topics, themes, estimated_difficulty)
        // - Send to Gemini 2.5 Flash, request JSON with shape:
        //     {
        //       modules: [
        //         {
        //           title: string,
        //           description: string,
        //           order: number,
        //           lessons: [
        //             {
        //               title: string,
        //               objective: string,   // one sentence: what the student will learn
        //               order: number
        //             }
        //           ]
        //         }
        //       ]
        //     }
        // - Validate that number of modules and lessons matches config

        // ─── STEP 7 — Persist course structure ────────────────────────────────
        // - Insert all modules into `modules` table (course_id, title, description, order)
        // - For each module, insert its lessons into `lessons` table:
        //     · module_id, course_id, title, objective, order
        //     · status = 'not_generated'  (content blocks generated later, on demand)

        // ─── STEP 8 — Mark course as ready ────────────────────────────────────
        // - Update course status → 'ready'
        // - Update course.generated_at = now()
        // - Log completion: job id, course id, total duration
      }
      catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[course-generation] Job ${job.id} failed for course ${courseId}: ${message}`)
        // Best-effort status update so the user is never left with a stuck 'processing' course
        await updateCourseGenerationStatus(adminClient, courseId, 'failed', message).catch(() => {})
        throw err
      }
    },
    {
      connection: { url: redisUrl },
    },
  )
}

function cleanExtractedText(raw: string): string {
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
