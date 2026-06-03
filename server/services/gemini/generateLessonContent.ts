import { z } from 'zod';
import { getGeminiClient } from './geminiClient';
import { embedBatch } from './embedChunks';
import { semanticSearchChunks } from '../../repositories/courseRepo';
import type { Lesson, LessonContent } from '../../../types/course';
import type { CourseConfig } from '../../../types/course';

const CONTENT_MODEL = 'gemini-2.5-flash';
// Chunks retrieved per rag_search_query
const CHUNKS_PER_QUERY = 5;
// Max total context chunks after deduplication
const MAX_CONTEXT_CHUNKS = 12;
const MAX_RETRIES = 3;

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const multipleChoiceSchema = z.object({
  type: z.literal('multiple_choice'),
  question: z.string(),
  options: z.array(z.string()).min(2).max(4),
  correct_index: z.number().int().min(0).max(3),
  explanation: z.string()
});

const trueFalseSchema = z.object({
  type: z.literal('true_false'),
  statement: z.string(),
  is_true: z.boolean(),
  explanation: z.string()
});

const fillBlankSchema = z.object({
  type: z.literal('fill_blank'),
  sentence: z.string(),
  answer: z.string(),
  explanation: z.string()
});

const exerciseSchema = z.discriminatedUnion('type', [
  multipleChoiceSchema,
  trueFalseSchema,
  fillBlankSchema
]);

const lessonSectionSchema = z.object({
  type: z.literal('section'),
  title: z.string(),
  content: z.string()
});

const lessonStepSchema = z.discriminatedUnion('type', [
  lessonSectionSchema,
  multipleChoiceSchema,
  trueFalseSchema,
  fillBlankSchema
]);

const lessonContentSchema = z.object({
  introduction: z.string(),
  steps: z.array(lessonStepSchema).min(6),
  summary: z.string()
});

// ─── Context retrieval via RAG ────────────────────────────────────────────────

async function retrieveContext(
  lesson: Lesson
): Promise<Array<{ id: string; content: string; similarity: number }>> {
  const MIN_QUERIES = 3;

  let queries = lesson.key_topics;

  if (queries.length < MIN_QUERIES) {
    queries = [...queries, ...lesson.learning_objectives];
  }

  if (queries.length < MIN_QUERIES) {
    queries = [...queries, lesson.title];
  }

  // Embed all search queries in a single batch call
  const embeddings = await embedBatch(queries);

  // Search for similar chunks for each query
  const results = await Promise.all(
    embeddings.map((embedding) =>
      semanticSearchChunks(lesson.course_id, embedding, CHUNKS_PER_QUERY)
    )
  );

  // Deduplicate by chunk id, keeping the highest similarity score
  const seen = new Map<string, { id: string; content: string; similarity: number }>();
  for (const batch of results) {
    for (const chunk of batch) {
      const existing = seen.get(chunk.id);
      if (!existing || chunk.similarity > existing.similarity) {
        seen.set(chunk.id, chunk);
      }
    }
  }

  // Sort by similarity descending and cap at MAX_CONTEXT_CHUNKS
  return Array.from(seen.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MAX_CONTEXT_CHUNKS);
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(
  lesson: Lesson,
  config: CourseConfig,
  contextChunks: Array<{ content: string; similarity: number }>
): string {
  const language = config.language ?? 'English';
  const level = config.language_level ?? 'Standard';
  const tone = config.tone ?? 'Standard';

  const objectivesList = lesson.learning_objectives.map((o, i) => `  ${i + 1}. ${o}`).join('\n');

  const topicsList = lesson.key_topics.join(', ');

  const contextText =
    contextChunks.length > 0
      ? contextChunks
          .map(
            (c, i) =>
              `### Source extract ${i + 1} (relevance: ${(c.similarity * 100).toFixed(0)}%)\n${c.content}`
          )
          .join('\n\n')
      : 'No specific source material retrieved — generate content based on the lesson objectives and topics.';

  return `You are a Senior Instructional Designer creating engaging lesson content for an online course.

## Lesson Details
- **Title:** ${lesson.title}
- **Description:** ${lesson.description}
- **Learning Objectives:**
${objectivesList}
- **Key Topics:** ${topicsList}
- **Output Language:** ${language}
- **Language Level:** ${level}
- **Tone:** ${tone}

## Relevant Source Material (retrieved via semantic search)
${contextText}

## Task
Create dynamic, engaging lesson content grounded in the source material above. Present it as an interleaved sequence of short sections and exercises.

**Requirements:**
1. **Introduction:** Exactly 1 paragraph that sets context and motivates the learner.
2. **Steps:** A single ordered array that interleaves sections and exercises. Follow this pattern:
   - Write 4–6 sections, each covering one focused concept from the lesson. Each section must have exactly 1 concise paragraph (3–5 sentences). Use concrete examples from the source material.
   - After every 1–2 sections, insert an exercise that reviews what was just covered.
   - Include at least 5 exercises total. Mix the three exercise types:
     - \`multiple_choice\`: question, 4 options (A–D), correct_index (0-based), plausible distractors, explanation.
     - \`true_false\`: factual statement, is_true boolean, explanation.
     - \`fill_blank\`: sentence with \`___\` for the blank, exact answer (one word or short phrase), explanation.
   - Each exercise must include a concise \`explanation\` shown after answering.
3. **Summary:** Exactly 1 paragraph consolidating the main takeaways.

**Critical rules:**
- NEVER reference sources, source numbers, or where content came from (e.g., do NOT write "according to source 1", "as mentioned in the document", etc.). Present all knowledge directly as facts.
- All text must be in **${language}**.
- Respond with ONLY the following JSON — no markdown fences or extra text.

## Required JSON Structure
{
  "introduction": "One engaging paragraph...",
  "steps": [
    {
      "type": "section",
      "title": "Section title",
      "content": "One focused paragraph..."
    },
    {
      "type": "multiple_choice",
      "question": "...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "..."
    },
    {
      "type": "section",
      "title": "Next section title",
      "content": "One focused paragraph..."
    },
    {
      "type": "true_false",
      "statement": "...",
      "is_true": true,
      "explanation": "..."
    },
    {
      "type": "fill_blank",
      "sentence": "The ___ is responsible for...",
      "answer": "exact answer",
      "explanation": "..."
    }
  ],
  "summary": "One consolidating paragraph..."
}`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Generates full lesson content (sections + exercises) using Gemini, grounded
 * in source material retrieved via semantic search over the course's document chunks.
 */
export async function generateLessonContent(
  lesson: Lesson,
  config: CourseConfig
): Promise<LessonContent> {
  const contextChunks = await retrieveContext(lesson);
  const prompt = buildPrompt(lesson, config, contextChunks);
  const ai = getGeminiClient();

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: CONTENT_MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const raw = response.text;
      if (!raw) {
        throw new Error('Gemini returned an empty response for lesson content generation');
      }

      const parsed = lessonContentSchema.parse(JSON.parse(raw));
      return parsed as LessonContent;
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[generateLessonContent] Attempt ${attempt}/${MAX_RETRIES} failed: ${message}`);
    }
  }

  throw lastError;
}
