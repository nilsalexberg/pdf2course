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
