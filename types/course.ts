export type CourseStatus = 'draft' | 'pending_review' | 'approved' | 'rejected'

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
  created_at: string
  updated_at: string
}
