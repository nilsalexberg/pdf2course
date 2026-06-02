import { createError } from 'h3'
import type { CourseWithSignedCover, ModuleWithLessons } from '../../../types/course'
import { getCourseById, listModulesWithLessons, listLessonCompletionsByCourse } from '../../repositories/courseRepo'
import { createSignedCoverUrl } from '../../storage/courseCovers'

const SIGNED_URL_EXPIRES_SEC = 3600

export interface LearnStructure {
  course: CourseWithSignedCover
  modules: ModuleWithLessons[]
  completedLessonIds: string[]
}

export async function getLearnStructure(courseId: string, userId: string): Promise<LearnStructure> {
  const course = await getCourseById(courseId)
  if (!course) throw createError({ statusCode: 404, statusMessage: 'Course not found' })

  if (course.producer_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  if (course.generation_status !== 'ready') {
    throw createError({ statusCode: 400, statusMessage: 'Course structure is not ready yet' })
  }

  const [cover_url_signed, modules, completions] = await Promise.all([
    course.cover_url ? createSignedCoverUrl(course.cover_url, SIGNED_URL_EXPIRES_SEC) : Promise.resolve(null),
    listModulesWithLessons(courseId),
    listLessonCompletionsByCourse(userId, courseId),
  ])

  return {
    course: { ...course, cover_url_signed } as CourseWithSignedCover,
    modules,
    completedLessonIds: completions.map(c => c.lesson_id),
  }
}
