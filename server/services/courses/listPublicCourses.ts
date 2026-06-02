import type { CourseWithSignedCover } from '../../../types/course'
import { listPublicCourses as listPublicCoursesFromDb } from '../../repositories/courseRepo'
import { createSignedCoverUrl } from '../../storage/courseCovers'

const SIGNED_URL_EXPIRES_SEC = 3600

export async function listPublicCourses(opts: { search?: string; limit: number; offset: number }): Promise<{ courses: CourseWithSignedCover[]; total: number }> {
  const { courses, total } = await listPublicCoursesFromDb(opts)
  if (!courses) throw createError({ statusCode: 500, statusMessage: 'Failed to list public courses' })

  const withCovers = await Promise.all(courses.map(async course => ({
    ...course,
    cover_url_signed: course.cover_url ? await createSignedCoverUrl(course.cover_url, SIGNED_URL_EXPIRES_SEC) : null,
  })))
  return { courses: withCovers, total }
}
