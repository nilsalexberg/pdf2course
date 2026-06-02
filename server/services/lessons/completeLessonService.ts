import { createError } from 'h3'
import { getCourseById, getLessonById, upsertLessonCompletion } from '../../repositories/courseRepo'
import type { LessonCompletion } from '../../../types/course'

export async function completeLessonService(
  courseId: string,
  lessonId: string,
  userId: string,
  scorePercent: number,
): Promise<LessonCompletion> {
  const course = await getCourseById(courseId)
  
  if (!course) {
    throw createError({ statusCode: 404, statusMessage: 'Course not found' })
  }

  if (course.producer_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const lesson = await getLessonById(lessonId)
  if (lesson.course_id !== courseId) {
    throw createError({ statusCode: 404, statusMessage: 'Lesson not found' })
  }

  if (lesson.status !== 'ready') {
    throw createError({ statusCode: 400, statusMessage: 'Lesson content is not ready' })
  }

  return upsertLessonCompletion({
    user_id: userId,
    lesson_id: lessonId,
    course_id: courseId,
    score_percent: scorePercent,
  })
}
