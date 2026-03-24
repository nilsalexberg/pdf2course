import { describe, it, expect } from 'vitest'
import { splitIntoChunks } from './textProcessing'

describe('splitIntoChunks', () => {
  // We know the constants from the implementation:
  // TARGET_CHUNK_SIZE = 1200
  // CHUNK_OVERLAP = 200
  // MAX_SENTENCE_SIZE = 1200

  it('should return an empty array for empty or whitespace-only text', () => {
    expect(splitIntoChunks('')).toEqual([])
    expect(splitIntoChunks('   \n\n  \t  ')).toEqual([])
  })

  it('should return a single chunk if text is smaller than TARGET_CHUNK_SIZE', () => {
    const text = 'This is a small text.'
    const chunks = splitIntoChunks(text)
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toBe(text)
  })

  it('should trim whitespace around and inside paragraphs', () => {
    const text = '  Paragraph 1.  \n\n   Paragraph 2.  \n\n\n\n'
    const chunks = splitIntoChunks(text)
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toBe('Paragraph 1.\n\nParagraph 2.')
  })

  it('should combine multiple small paragraphs into a single chunk up to TARGET_CHUNK_SIZE', () => {
    const p1 = 'A'.repeat(500)
    const p2 = 'B'.repeat(500)
    const text = `${p1}\n\n${p2}`
    const chunks = splitIntoChunks(text)
    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toBe(`${p1}\n\n${p2}`)
  })

  it('should split paragraphs that cumulatively exceed TARGET_CHUNK_SIZE and include overlap', () => {
    // 800 chars first paragraph
    const p1 = 'A'.repeat(400) + ' ' + 'B'.repeat(399) // length = 800
    // 600 chars second paragraph
    const p2 = 'C'.repeat(600)
    
    // total = 800 + 2 + 600 = 1402 (exceeds 1200)
    const text = `${p1}\n\n${p2}`
    const chunks = splitIntoChunks(text)
    
    expect(chunks.length).toBeGreaterThan(1)
    expect(chunks[0]).toBe(p1) // first paragraph precisely fits into the first chunk
    
    // overlap generation: take last 200 chars (CHUNK_OVERLAP) from chunk1, then find first space bounds
    // The last 200 chars of p1 are all 'B's, so it returns the last 200 'B's
    // Since there's no space in the last 200 chars, the overlap suffix is exactly the last 200 'B's.
    const expectedOverlap = 'B'.repeat(200)
    expect(chunks[1]).toBe(`${expectedOverlap}\n\n${p2}`)
  })

  it('should split a single large paragraph (>1200 chars) by sentences', () => {
    const s1 = 'Sentence one is quite long although we just repeat letters ' + 'A'.repeat(500) + '.' // ~560 chars
    const s2 = 'Sentence two is also quite long ' + 'B'.repeat(500) + '?' // ~533 chars
    const s3 = 'Sentence three pushes us over the edge ' + 'C'.repeat(500) + '!' // ~540 chars
    
    // total length = ~1633 chars in one paragraph
    const text = `${s1} ${s2} ${s3}`
    const chunks = splitIntoChunks(text)
    
    expect(chunks.length).toBeGreaterThan(1)
    
    // first chunk should contain s1 and s2 ~1094 chars, 
    // it can't fit s3 without exceeding 1200
    expect(chunks[0]).toBe(`${s1} ${s2}`)
    
    // The overlap for the next chunk depends on the last CHUNK_OVERLAP=200 chars of chunk[0].
    // chunk[0] ends in 'B'.repeat(500) + '?'.
    // The last 200 chars are all 'B's + '?'. No space. So overlap is 'B'.repeat(199) + '?'
    const expectedOverlap = 'B'.repeat(199) + '?'
    expect(chunks[1]).toBe(`${expectedOverlap} ${s3}`)
  })

  it('should hard-cap sentences that lack punctuation and slice at word boundaries', () => {
    // A single word of 1300 chars (exceeds MAX_SENTENCE_SIZE = 1200)
    const longWord = 'W'.repeat(1300)
    const chunks1 = splitIntoChunks(longWord)
    expect(chunks1).toHaveLength(2)
    // First chunk will be sliced exactly at 1200 because there is no space
    expect(chunks1[0]).toBe('W'.repeat(1200))
    // Overlap will be 200 chars. Then it adds a space before appending the current sentence
    expect(chunks1[1]).toBe('W'.repeat(200) + ' ' + 'W'.repeat(100))

    // Now test with a space acting as a word boundary
    const part1 = 'A'.repeat(1100)
    const part2 = 'B'.repeat(200) // Total 1301 > 1200
    const textWithSpace = `${part1} ${part2}`
    
    const chunks2 = splitIntoChunks(textWithSpace)
    expect(chunks2).toHaveLength(2)
    // The slice is 1200 chars: 'A'.repeat(1100) + ' ' + 'B'.repeat(99)
    // But it will find the last space which is at index 1100.
    // So the cut is at 1100, meaning chunk[0] is part1.
    expect(chunks2[0]).toBe(part1)
    
    // Then chunk[1] uses overlap from part1 (last 200 chars) + 'B'.repeat(200)
    const expectedOverlap2 = 'A'.repeat(200) 
    expect(chunks2[1]).toBe(`${expectedOverlap2} ${part2}`)
  })
})
