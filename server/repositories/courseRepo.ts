import { createError } from 'h3';
import { eq, and, ilike, desc, asc, sql, count } from 'drizzle-orm';
import { db } from '../db';
import {
  courses,
  coursePdfs,
  documentChunks,
  modules,
  lessons,
  lessonCompletions
} from '../db/schema';
import type {
  Course,
  CoursePdf,
  DocumentChunk,
  DocumentSummary,
  GenerationStatus,
  LessonCompletion,
  LessonContent,
  LessonStatus,
  Module,
  Lesson,
  ModuleWithLessons
} from '../../types/course';
import { emitGenerationStatus } from '../utils/generationEvents';

// ─── courses ──────────────────────────────────────────────────────────────────

export async function listCoursesByProducerId(producerId: string): Promise<Course[]> {
  const rows = await db
    .select()
    .from(courses)
    .where(eq(courses.producerId, producerId))
    .orderBy(desc(courses.createdAt));
  return rows;
}

export async function insertCourse(input: {
  producer_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  config: any;
}): Promise<Course | null> {
  const result = await db
    .insert(courses)
    .values({
      producerId: input.producer_id,
      title: input.title,
      description: input.description,
      coverUrl: input.cover_url,
      config: input.config
    })
    .returning();
  return result[0];
}

export async function updateCourseCoverUrl(
  courseId: string,
  coverUrl: string | null
): Promise<void> {
  await db.update(courses).set({ coverUrl }).where(eq(courses.id, courseId));
}

export async function getCourseById(id: string): Promise<Course | null> {
  const result = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!result[0]) throw createError({ statusCode: 404, statusMessage: 'Course not found' });
  return result[0];
}

export async function updateCourse(
  id: string,
  input: { title: string; description: string | null; config: any }
): Promise<Course | null> {
  const result = await db
    .update(courses)
    .set({
      title: input.title,
      description: input.description,
      config: input.config,
      updatedAt: new Date()
    })
    .where(eq(courses.id, id))
    .returning();
  if (!result[0]) throw createError({ statusCode: 500, statusMessage: 'Course update failed' });
  return result[0];
}

export async function deleteCourse(id: string): Promise<void> {
  await db.delete(courses).where(eq(courses.id, id));
}

export async function listAllCourses(): Promise<Course[]> {
  const rows = await db.select().from(courses).orderBy(desc(courses.createdAt));
  return rows;
}

export async function updateCourseStatus(
  courseId: string,
  status: Course['status'],
  rejectionReason?: string | null
): Promise<Course | null> {
  const update: Record<string, unknown> = { status, updatedAt: new Date() };
  if (rejectionReason !== undefined) update.rejectionReason = rejectionReason;
  const result = await db.update(courses).set(update).where(eq(courses.id, courseId)).returning();
  if (!result[0]) throw createError({ statusCode: 500, statusMessage: 'Status update failed' });
  return result[0];
}

export async function listPublicCourses(opts: {
  search?: string;
  limit: number;
  offset: number;
}): Promise<{ courses: Course[]; total: number }> {
  const where = opts.search
    ? and(eq(courses.status, 'approved'), ilike(courses.title, `%${opts.search}%`))
    : eq(courses.status, 'approved');

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(courses)
      .where(where)
      .orderBy(desc(courses.createdAt))
      .limit(opts.limit)
      .offset(opts.offset),
    db.select({ total: count() }).from(courses).where(where)
  ]);

  const total = countResult[0]?.total ?? 0;
  return { courses: rows, total: Number(total) };
}

export async function updateCourseGenerationStatus(
  courseId: string,
  generationStatus: GenerationStatus,
  generationError: string | null = null
): Promise<Course | null> {
  const result = await db
    .update(courses)
    .set({
      generationStatus,
      generationError,
      updatedAt: new Date()
    })
    .where(eq(courses.id, courseId))
    .returning();
  if (!result[0])
    throw createError({ statusCode: 500, statusMessage: 'Generation status update failed' });
  emitGenerationStatus(courseId, generationStatus, generationError);
  return result[0];
}

export async function updateCourseGeneratedAt(courseId: string): Promise<void> {
  await db
    .update(courses)
    .set({ generatedAt: new Date(), updatedAt: new Date() })
    .where(eq(courses.id, courseId));
}

// ─── course_pdfs ──────────────────────────────────────────────────────────────

export async function insertCoursePdf(input: {
  course_id: string;
  file_path: string;
  filename: string;
  size_bytes: number;
}): Promise<void> {
  await db.insert(coursePdfs).values({
    courseId: input.course_id,
    filePath: input.file_path,
    filename: input.filename,
    sizeBytes: input.size_bytes
  });
}

export async function listCoursePdfs(courseId: string): Promise<CoursePdf[]> {
  const rows = await db
    .select()
    .from(coursePdfs)
    .where(eq(coursePdfs.courseId, courseId))
    .orderBy(asc(coursePdfs.createdAt));
  return rows;
}

export async function getCoursePdfById(pdfId: string): Promise<CoursePdf> {
  const result = await db.select().from(coursePdfs).where(eq(coursePdfs.id, pdfId)).limit(1);
  if (!result[0]) throw createError({ statusCode: 404, statusMessage: 'PDF not found' });
  return result[0];
}

export async function deleteCoursePdfFromDb(pdfId: string): Promise<void> {
  await db.delete(coursePdfs).where(eq(coursePdfs.id, pdfId));
}

export async function updateCoursePdfText(pdfId: string, extractedText: string): Promise<void> {
  await db
    .update(coursePdfs)
    .set({ extractedText, updatedAt: new Date() })
    .where(eq(coursePdfs.id, pdfId));
}

export async function updateCoursePdfAiSummary(
  pdfId: string,
  aiSummary: DocumentSummary
): Promise<void> {
  await db
    .update(coursePdfs)
    .set({ aiSummary, updatedAt: new Date() })
    .where(eq(coursePdfs.id, pdfId));
}

// ─── document_chunks ──────────────────────────────────────────────────────────

export async function deleteDocumentChunksByPdfId(coursePdfId: string): Promise<void> {
  await db.delete(documentChunks).where(eq(documentChunks.coursePdfId, coursePdfId));
}

const CHUNK_INSERT_BATCH_SIZE = 100;

export async function insertDocumentChunks(
  chunks: Array<{ course_id: string; course_pdf_id: string; chunk_index: number; content: string }>
): Promise<void> {
  if (chunks.length === 0) return;
  for (let i = 0; i < chunks.length; i += CHUNK_INSERT_BATCH_SIZE) {
    const batch = chunks.slice(i, i + CHUNK_INSERT_BATCH_SIZE);
    await db.insert(documentChunks).values(
      batch.map((c) => ({
        courseId: c.course_id,
        coursePdfId: c.course_pdf_id,
        chunkIndex: c.chunk_index,
        content: c.content
      }))
    );
  }
}

export async function listDocumentChunksByCourseId(courseId: string): Promise<DocumentChunk[]> {
  const rows = await db
    .select()
    .from(documentChunks)
    .where(eq(documentChunks.courseId, courseId))
    .orderBy(asc(documentChunks.chunkIndex));
  return rows.map((r) => ({
    id: r.id,
    course_id: r.courseId,
    course_pdf_id: r.coursePdfId,
    chunk_index: r.chunkIndex,
    content: r.content,
    embedding: null,
    created_at: r.createdAt.toISOString()
  })) as DocumentChunk[];
}

export async function batchUpdateDocumentChunkEmbeddings(
  updates: Array<{ id: string; embedding: number[] }>
): Promise<void> {
  for (const { id, embedding } of updates) {
    await db.execute(
      sql`UPDATE document_chunks SET embedding = ${`[${embedding.join(',')}]`}::vector WHERE id = ${id}::uuid`
    );
  }
}

export async function semanticSearchChunks(
  courseId: string,
  queryEmbedding: number[],
  matchCount: number = 5
): Promise<Array<{ id: string; content: string; similarity: number }>> {
  const result = await db.execute(
    sql`SELECT id::text, content, similarity FROM match_document_chunks(${courseId}::uuid, ${`[${queryEmbedding.join(',')}]`}::vector(3072), ${matchCount})`
  );
  return (result as any[]).map((r) => ({
    id: r.id,
    content: r.content,
    similarity: Number(r.similarity)
  }));
}

// ─── modules & lessons ────────────────────────────────────────────────────────

export async function deleteCourseModules(courseId: string): Promise<void> {
  await db.delete(modules).where(eq(modules.courseId, courseId));
}

export async function insertModules(
  rows: Array<{ course_id: string; module_number: number; title: string; description: string }>
): Promise<Module[]> {
  const result = await db
    .insert(modules)
    .values(
      rows.map((r) => ({
        courseId: r.course_id,
        moduleNumber: r.module_number,
        title: r.title,
        description: r.description
      }))
    )
    .returning();
  return result;
}

export async function insertLessons(
  rows: Array<{
    module_id: string;
    course_id: string;
    lesson_number: number;
    title: string;
    description: string;
    learning_objectives: string[];
    key_topics: string[];
  }>
): Promise<void> {
  if (rows.length === 0) return;
  await db.insert(lessons).values(rows);
}

export async function listModulesWithLessons(courseId: string): Promise<ModuleWithLessons[]> {
  const [mods, less] = await Promise.all([
    db
      .select()
      .from(modules)
      .where(eq(modules.courseId, courseId))
      .orderBy(asc(modules.moduleNumber)),
    db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(asc(lessons.lessonNumber))
  ]);
  const lessonMap = new Map<string, Lesson[]>();
  for (const l of less) {
    const arr = lessonMap.get(l.moduleId) ?? [];
    arr.push(l);
    lessonMap.set(l.moduleId, arr);
  }
  return mods.map((m) => ({ ...m, lessons: lessonMap.get(m.id) ?? [] }));
}

export async function updateModule(
  moduleId: string,
  input: { title: string; description: string }
): Promise<Module> {
  const result = await db.update(modules).set(input).where(eq(modules.id, moduleId)).returning();
  if (!result[0]) throw createError({ statusCode: 500, statusMessage: 'Module update failed' });
  return result[0];
}

export async function getLessonById(lessonId: string): Promise<Lesson> {
  const result = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  if (!result[0]) throw createError({ statusCode: 404, statusMessage: 'Lesson not found' });
  return result[0];
}

export async function updateLesson(
  lessonId: string,
  input: { title: string; description: string; learning_objectives: string[]; key_topics: string[] }
): Promise<Lesson> {
  const result = await db
    .update(lessons)
    .set({
      title: input.title,
      description: input.description,
      learningObjectives: input.learning_objectives,
      keyTopics: input.key_topics
    })
    .where(eq(lessons.id, lessonId))
    .returning();
  if (!result[0]) throw createError({ statusCode: 500, statusMessage: 'Lesson update failed' });
  return result[0];
}

export async function updateLessonStatus(
  lessonId: string,
  status: LessonStatus,
  generationError: string | null = null
): Promise<void> {
  await db.update(lessons).set({ status, generationError }).where(eq(lessons.id, lessonId));
}

export async function updateLessonContent(
  lessonId: string,
  content: LessonContent
): Promise<Lesson> {
  const result = await db
    .update(lessons)
    .set({
      content,
      status: 'ready',
      generationError: null
    })
    .where(eq(lessons.id, lessonId))
    .returning();
  if (!result[0])
    throw createError({ statusCode: 500, statusMessage: 'Lesson content update failed' });
  return result[0];
}

// ─── lesson_completions ───────────────────────────────────────────────────────

export async function listLessonCompletionsByCourse(
  userId: string,
  courseId: string
): Promise<LessonCompletion[]> {
  const rows = await db
    .select()
    .from(lessonCompletions)
    .where(and(eq(lessonCompletions.userId, userId), eq(lessonCompletions.courseId, courseId)));
  return rows;
}

export async function upsertLessonCompletion(input: {
  user_id: string;
  lesson_id: string;
  course_id: string;
  score_percent: number;
}): Promise<LessonCompletion> {
  const result = await db
    .insert(lessonCompletions)
    .values({
      userId: input.user_id,
      lessonId: input.lesson_id,
      courseId: input.course_id,
      scorePercent: input.score_percent,
      completedAt: new Date()
    })
    .onConflictDoUpdate({
      target: [lessonCompletions.userId, lessonCompletions.lessonId],
      set: { scorePercent: input.score_percent, completedAt: new Date() }
    })
    .returning();
  return result[0];
}

export async function deleteLessonCompletionsByCourseId(courseId: string): Promise<void> {
  await db.delete(lessonCompletions).where(eq(lessonCompletions.courseId, courseId));
}
