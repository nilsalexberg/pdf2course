import { getGeminiClient } from './geminiClient'

const EMBEDDING_MODEL = 'gemini-embedding-001'
// gemini-embedding-001 natively produces 3072-dim vectors; Matryoshka truncation
// to 768 keeps us compatible with the existing document_chunks.embedding column.
const OUTPUT_DIMENSIONALITY = 768
// Gemini embedContent accepts up to 100 texts per request
export const EMBED_BATCH_SIZE = 100

const MAX_RETRIES = 4
const BASE_DELAY_MS = 500

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('429') || /rate.?limit|quota|resource.?exhausted/i.test(msg)
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn()
    }
    catch (err) {
      if (attempt === MAX_RETRIES) throw err
      const delay = BASE_DELAY_MS * 2 ** attempt + Math.random() * 100
      console.warn(
        `[embedChunks] Attempt ${attempt + 1} failed${isRetryable(err) ? ' (rate limit)' : ''}, retrying in ${Math.round(delay)}ms`,
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  // unreachable, but required for TypeScript
  throw new Error('unreachable')
}

/**
 * Calls the Gemini embedding API for a batch of up to 100 texts.
 * Retries up to MAX_RETRIES times with exponential backoff on transient errors.
 * Returns one vector per input, in the same order.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const ai = getGeminiClient()
  const response = await withRetry(() =>
    ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: texts,
      config: { outputDimensionality: OUTPUT_DIMENSIONALITY },
    }),
  )

  const embeddings = response.embeddings
  if (!embeddings || embeddings.length !== texts.length) {
    throw new Error(
      `Gemini returned ${embeddings?.length ?? 0} embeddings for ${texts.length} inputs`,
    )
  }

  return embeddings.map((e, i) => {
    if (!e.values) throw new Error(`Missing values for embedding at index ${i}`)
    return e.values
  })
}
