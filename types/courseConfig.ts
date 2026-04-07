export const COURSE_LANGUAGE_LEVELS = [
  'Standard',
  'Technical',
  'Academic',
  'Simplified',
  'Children',
] as const

export const COURSE_FOCUS_OPTIONS = [
  'Balanced',
  'Theoretical',
  'Practical',
] as const

export const COURSE_LANGUAGES = [
  'English',
  'Portuguese',
  'Spanish',
] as const

export const COURSE_TONES = [
  'Standard',
  'Formal',
  'Casual',
  'Inspiring',
] as const

export type CourseLanguageLevel = (typeof COURSE_LANGUAGE_LEVELS)[number]
export type CourseFocus = (typeof COURSE_FOCUS_OPTIONS)[number]
export type CourseLanguage = (typeof COURSE_LANGUAGES)[number]
export type CourseTone = (typeof COURSE_TONES)[number]

export const DEFAULT_CHUNK_SIZE = 1200
export const DEFAULT_CHUNK_OVERLAP = 200

export const CHUNK_SIZE_LIMITS = { min: 400, max: 4000 } as const
export const CHUNK_OVERLAP_LIMITS = { min: 0, max: 800 } as const
