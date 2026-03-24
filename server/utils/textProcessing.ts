// Target character count per chunk (~300 tokens at ~4 chars/token)
export const TARGET_CHUNK_SIZE = 1200
// Characters from the end of each chunk carried into the start of the next
export const CHUNK_OVERLAP = 200
// Hard cap per sentence to guard against malformed PDFs with no punctuation
export const MAX_SENTENCE_SIZE = TARGET_CHUNK_SIZE

/**
 * Returns the trailing ~CHUNK_OVERLAP characters of a chunk, starting at a word
 * boundary so the overlap never begins mid-word.
 */
export function getOverlapSuffix(text: string): string {
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
