import { z } from 'zod';
import { getGeminiClient } from './geminiClient';
import type { Course, CoursePdf } from '../../../types/course';

const STRUCTURE_MODEL = 'gemini-2.5-flash';

const lessonSchema = z.object({
  lessonNumber: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  learningObjectives: z.array(z.string()),
  keyTopics: z.array(z.string())
});

const moduleSchema = z.object({
  moduleNumber: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  lessons: z.array(lessonSchema)
});

export const courseStructureSchema = z.object({
  modules: z.array(moduleSchema)
});

export type CourseStructure = z.infer<typeof courseStructureSchema>;
export type GeneratedModule = z.infer<typeof moduleSchema>;
export type GeneratedLesson = z.infer<typeof lessonSchema>;

function buildPrompt(
  course: Course,
  pdfs: CoursePdf[],
  numModules: number,
  lessonsPerModule: number
): string {
  const { config } = course;
  const summariesText = pdfs
    .filter((p) => p.aiSummary)
    .map((p, i) => `### Document ${i + 1}: ${p.filename}\n${JSON.stringify(p.aiSummary, null, 2)}`)
    .join('\n\n');

  return `You are a Senior Instructional Designer specializing in creating structured, engaging courses.

Your task is to design the complete course structure (modules and lessons) for the course described below, based on the document summaries provided.

## Course Details
- **Title:** ${course.title}
- **Description:** ${course.description ?? 'Not provided'}
- **Required structure:** EXACTLY ${numModules} modules, each with EXACTLY ${lessonsPerModule} lessons
- **Language level:** ${config.languageLevel ?? 'Standard'}
- **Focus:** ${config.focus ?? 'Balanced'}
- **Output language:** ${config.language ?? 'English'}
- **Tone:** ${config.tone ?? 'Standard'}

## Document Summaries (Knowledge Taxonomy)
${summariesText}

## Instructions
1. Create EXACTLY ${numModules} modules — no more, no less.
2. Each module must have EXACTLY ${lessonsPerModule} lessons — no more, no less.
3. Distribute content logically across modules, ensuring a coherent learning journey from fundamentals to advanced topics.
4. For each lesson provide:
   - A clear title and concise description
   - 2–4 specific, measurable learningObjectives (start with action verbs: "Understand", "Apply", "Calculate", etc.)
   - 3–6 keyTopics that will be covered
5. All text (titles, descriptions, objectives, topics) must be written in: ${config.language ?? 'English'}
6. Respond with ONLY the JSON structure described below, no markdown fences or extra text.

## Required JSON Structure
{
  "modules": [
    {
      "moduleNumber": 1,
      "title": "Module title",
      "description": "Brief description of what this module covers",
      "lessons": [
        {
          "lessonNumber": 1,
          "title": "Lesson title",
          "description": "Concise scope of this lesson",
          "learningObjectives": ["Objective 1", "Objective 2"],
          "keyTopics": ["Topic A", "Topic B"],
        }
      ]
    }
  ]
}`;
}

const MAX_RETRIES = 3;

/**
 * Calls Gemini to generate the full course structure (modules + lessons) from
 * document summaries. Validates the response with Zod and enforces the
 * numModules / lessonsPerModule business rules before returning.
 * Retries up to MAX_RETRIES times on any failure (API, parse, or business rule).
 */
export async function generateCourseStructure(
  course: Course,
  pdfs: CoursePdf[]
): Promise<CourseStructure> {
  const numModules = course.config.numModules ?? 3;
  const lessonsPerModule = course.config.lessonsPerModule ?? 3;
  const ai = getGeminiClient();
  const prompt = buildPrompt(course, pdfs, numModules, lessonsPerModule);

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: STRUCTURE_MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const raw = response.text;
      if (!raw) {
        throw new Error('Gemini returned an empty response for course structure generation');
      }

      const parsed = courseStructureSchema.parse(JSON.parse(raw));

      if (parsed.modules.length !== numModules) {
        throw new Error(
          `Expected ${numModules} modules but Gemini returned ${parsed.modules.length}`
        );
      }

      for (const mod of parsed.modules) {
        if (mod.lessons.length !== lessonsPerModule) {
          throw new Error(
            `Module "${mod.title}" expected ${lessonsPerModule} lessons but has ${mod.lessons.length}`
          );
        }
      }

      return parsed;
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      console.warn(
        `[generateCourseStructure] Attempt ${attempt}/${MAX_RETRIES} failed: ${message}`
      );
    }
  }

  throw lastError;
}
