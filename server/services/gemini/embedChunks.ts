import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

const EMBEDDING_MODEL = 'gemini-embedding-001';
// Gemini embedContent accepts up to 100 texts per request
export const EMBED_BATCH_SIZE = 100;

let _embedder: GoogleGenerativeAIEmbeddings | null = null;

function getEmbedder(): GoogleGenerativeAIEmbeddings {
  if (!_embedder) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    _embedder = new GoogleGenerativeAIEmbeddings({
      model: EMBEDDING_MODEL,
      apiKey
    });
  }
  return _embedder;
}

/**
 * Calls the Gemini embedding API for a batch of up to 100 texts.
 * Retries are handled transparently by the LangChain SDK.
 * Returns one 3072-dim vector per input, in the same order.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const embedder = getEmbedder();
  return embedder.embedDocuments(texts);
}
