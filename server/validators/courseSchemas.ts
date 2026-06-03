import { z } from 'zod';
import {
  COURSE_LANGUAGE_LEVELS,
  COURSE_FOCUS_OPTIONS,
  COURSE_LANGUAGES,
  COURSE_TONES,
  CHUNK_SIZE_LIMITS,
  CHUNK_OVERLAP_LIMITS
} from '../../types/courseConfig';

export const CourseCreateLimits = {
  numModules: { min: 1, max: 50 },
  lessonsPerModule: { min: 1, max: 20 },
  pdfs: { maxFiles: 5, maxSizeBytes: 50 * 1024 * 1024 }
} as const;

export const courseCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z
    .string()
    .trim()
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  num_modules: z.coerce
    .number()
    .int()
    .refine(
      (v) => v >= CourseCreateLimits.numModules.min && v <= CourseCreateLimits.numModules.max,
      `num_modules must be between ${CourseCreateLimits.numModules.min} and ${CourseCreateLimits.numModules.max}`
    ),
  lessons_per_module: z.coerce
    .number()
    .int()
    .refine(
      (v) =>
        v >= CourseCreateLimits.lessonsPerModule.min &&
        v <= CourseCreateLimits.lessonsPerModule.max,
      `lessons_per_module must be between ${CourseCreateLimits.lessonsPerModule.min} and ${CourseCreateLimits.lessonsPerModule.max}`
    ),
  language_level: z.enum(COURSE_LANGUAGE_LEVELS as unknown as [string, ...string[]]),
  focus: z.enum(COURSE_FOCUS_OPTIONS as unknown as [string, ...string[]]),
  language: z.enum(COURSE_LANGUAGES as unknown as [string, ...string[]]),
  tone: z.enum(COURSE_TONES as unknown as [string, ...string[]]),
  chunk_size: z.coerce
    .number()
    .int()
    .min(CHUNK_SIZE_LIMITS.min)
    .max(CHUNK_SIZE_LIMITS.max)
    .optional(),
  chunk_overlap: z.coerce
    .number()
    .int()
    .min(CHUNK_OVERLAP_LIMITS.min)
    .max(CHUNK_OVERLAP_LIMITS.max)
    .optional()
});

export type CourseCreateInput = z.infer<typeof courseCreateSchema>;

export const lessonCompleteSchema = z.object({
  score_percent: z.number().int().min(0).max(100)
});

export type LessonCompleteInput = z.infer<typeof lessonCompleteSchema>;
