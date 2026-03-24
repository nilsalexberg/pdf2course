import { GoogleGenAI } from '@google/genai'

let _client: GoogleGenAI | null = null

/**
 * Returns a lazily-initialised, process-scoped Gemini client.
 * Reads GEMINI_API_KEY from the environment at first call.
 */
export function getGeminiClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set')
    }
    _client = new GoogleGenAI({ apiKey })
  }
  return _client
}
