import { z } from 'zod'

export const CourseCreateLimits = {
  numModules: { min: 1, max: 50 },
  lessonsPerModule: { min: 1, max: 20 },
  pdfs: { maxFiles: 5, maxSizeBytes: 50 * 1024 * 1024 },
} as const

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
      `num_modules must be between ${CourseCreateLimits.numModules.min} and ${CourseCreateLimits.numModules.max}`,
    ),
  lessons_per_module: z.coerce
    .number()
    .int()
    .refine(
      (v) =>
        v >= CourseCreateLimits.lessonsPerModule.min && v <= CourseCreateLimits.lessonsPerModule.max,
      `lessons_per_module must be between ${CourseCreateLimits.lessonsPerModule.min} and ${CourseCreateLimits.lessonsPerModule.max}`,
    ),
})

export type CourseCreateInput = z.infer<typeof courseCreateSchema>

