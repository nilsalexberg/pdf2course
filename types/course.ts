export type CourseStatus = 'draft' | 'pending_review' | 'approved' | 'rejected'

export type GenerationStatus = 'idle' | 'processing' | 'embedding' | 'summarizing' | 'generating_structure' | 'ready' | 'failed'

export const GENERATION_IN_PROGRESS: GenerationStatus[] = ['processing', 'embedding', 'summarizing', 'generating_structure']

import type { CourseLanguageLevel, CourseFocus, CourseLanguage, CourseTone } from './courseConfig'

export interface CourseConfig {
  num_modules?: number
  lessons_per_module?: number
  language_level?: CourseLanguageLevel
  focus?: CourseFocus
  language?: CourseLanguage
  tone?: CourseTone
}

export interface Course {
  id: string
  producer_id: string
  title: string
  description: string | null
  cover_url: string | null
  status: CourseStatus
  generation_status: GenerationStatus
  generation_error: string | null
  config: CourseConfig
  created_at: string
  updated_at: string
}

export interface CourseWithSignedCover extends Course {
  cover_url_signed: string | null
}

export interface DocumentSummaryTopic {
  topic_title: string
  key_concepts: string[]
  learning_objectives: string[]
}

export interface DocumentSummary {
  document_title: string
  core_themes: string[]
  estimated_target_difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  target_audience: string
  structural_outline: DocumentSummaryTopic[]
}

export interface CoursePdf {
  id: string
  course_id: string
  file_path: string
  filename: string
  size_bytes: number
  extracted_text: string | null
  ai_summary: DocumentSummary | null
  created_at: string
  updated_at: string
}

export interface CoursePdfWithSignedUrl extends CoursePdf {
  url_signed: string
}

export interface DocumentChunk {
  id: string
  course_id: string
  course_pdf_id: string
  chunk_index: number
  content: string
  embedding: number[] | null
  created_at: string
}

export interface Module {
  id: string
  course_id: string
  module_number: number
  title: string
  description: string
  created_at: string
}

export type LessonStatus = 'not_generated' | 'generating' | 'ready' | 'failed'

// ─── Lesson content types ──────────────────────────────────────────────────

export interface LessonSection {
  type: 'section'
  title: string
  content: string
}

export type LessonStep = LessonSection | Exercise

export interface MultipleChoiceExercise {
  type: 'multiple_choice'
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

export interface TrueFalseExercise {
  type: 'true_false'
  statement: string
  is_true: boolean
  explanation: string
}

export interface FillBlankExercise {
  type: 'fill_blank'
  sentence: string
  answer: string
  explanation: string
}

export type Exercise = MultipleChoiceExercise | TrueFalseExercise | FillBlankExercise

export interface LessonContent {
  introduction: string
  steps: LessonStep[]
  summary: string
}

// ──────────────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string
  module_id: string
  course_id: string
  lesson_number: number
  title: string
  description: string
  learning_objectives: string[]
  key_topics: string[]
  rag_search_queries: string[]
  status: LessonStatus
  content: LessonContent | null
  generation_error: string | null
  created_at: string
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[]
}
