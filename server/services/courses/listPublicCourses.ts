import type { CourseWithSignedCover } from '../../../types/course'
import { listPublicCourses as listPublicCoursesFromDb } from '../../repositories/courseRepo'
import { createSignedCoverUrl } from '../../storage/courseCovers'

const SIGNED_URL_EXPIRES_SEC = 3600

export async function listPublicCourses(
  client: any,
  opts: { search?: string; limit: number; offset: number },
): Promise<{ courses: CourseWithSignedCover[]; total: number }> {
  const { courses, total } = await listPublicCoursesFromDb(client, opts)

  const withCovers: CourseWithSignedCover[] = await Promise.all(
    courses.map(async (course) => {
      const cover_url_signed = course.cover_url
        ? await createSignedCoverUrl(client, course.cover_url, SIGNED_URL_EXPIRES_SEC)
        : null
      return { ...(course as any), cover_url_signed }
    }),
  )

  return { courses: withCovers, total }
}
