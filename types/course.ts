export type CourseStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

export type GenerationStatus =
  | 'idle'
  | 'processing'
  | 'embedding'
  | 'summarizing'
  | 'generating_structure'
  | 'ready'
  | 'failed';

export const GENERATION_IN_PROGRESS: GenerationStatus[] = [
  'processing',
  'embedding',
  'summarizing',
  'generating_structure'
];

import type { CourseLanguageLevel, CourseFocus, CourseLanguage, CourseTone } from './courseConfig';

export interface CourseConfig {
  numModules?: number;
  lessonsPerModule?: number;
  languageLevel?: CourseLanguageLevel;
  focus?: CourseFocus;
  language?: CourseLanguage;
  tone?: CourseTone;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface Course {
  id: string;
  producerId: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  status: CourseStatus;
  rejectionReason: string | null;
  generationStatus: GenerationStatus;
  generationError: string | null;
  config: CourseConfig;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseWithSignedCover extends Course {
  coverUrlSigned: string | null;
}

export interface DocumentSummaryTopic {
  topicTitle: string;
  keyConcepts: string[];
  learningObjectives: string[];
}

export interface DocumentSummary {
  documentTitle: string;
  coreThemes: string[];
  estimatedTargetDifficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  targetAudience: string;
  structuralOutline: DocumentSummaryTopic[];
}

export interface CoursePdf {
  id: string;
  courseId: string;
  filePath: string;
  filename: string;
  sizeBytes: number;
  extractedText: string | null;
  aiSummary: DocumentSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoursePdfWithSignedUrl extends CoursePdf {
  urlSigned: string;
}

export interface DocumentChunk {
  id: string;
  courseId: string;
  coursePdfId: string;
  chunkIndex: number;
  content: string;
  embedding: number[] | null;
  createdAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  moduleNumber: number;
  title: string;
  description: string;
  createdAt: string;
}

export type LessonStatus = 'not_generated' | 'generating' | 'ready' | 'failed';

// ─── Lesson content types ──────────────────────────────────────────────────

export interface LessonSection {
  type: 'section';
  title: string;
  content: string;
}

export type LessonStep = LessonSection | Exercise;

export interface MultipleChoiceExercise {
  type: 'multiple_choice';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TrueFalseExercise {
  type: 'true_false';
  statement: string;
  isTrue: boolean;
  explanation: string;
}

export interface FillBlankExercise {
  type: 'fill_blank';
  sentence: string;
  answer: string;
  explanation: string;
}

export type Exercise = MultipleChoiceExercise | TrueFalseExercise | FillBlankExercise;

export interface LessonContent {
  introduction: string;
  steps: LessonStep[];
  summary: string;
}

// ──────────────────────────────────────────────────────────────────────────

export interface Lesson {
  id: string;
  moduleId: string;
  courseId: string;
  lessonNumber: number;
  title: string;
  description: string;
  learningObjectives: string[];
  keyTopics: string[];
  status: LessonStatus;
  content: LessonContent | null;
  generationError: string | null;
  createdAt: string;
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export interface CourseStructure {
  courseTitle: string;
  modules: ModuleWithLessons[];
}

export interface LessonCompletion {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  scorePercent: number;
  completedAt: string;
}
