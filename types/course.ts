export type CourseStatus = 'draft' | 'pending_review' | 'approved' | 'rejected'

export type GenerationStatus = 'idle' | 'processing' | 'embedding' | 'summarizing' | 'generating_structure' | 'ready' | 'failed'

export const GENERATION_IN_PROGRESS: GenerationStatus[] = ['processing', 'embedding', 'summarizing', 'generating_structure']

export interface CourseConfig {
  num_modules?: number
  lessons_per_module?: number
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

export interface CoursePdf {
  id: string
  course_id: string
  file_path: string
  filename: string
  size_bytes: number
  extracted_text: string | null
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
