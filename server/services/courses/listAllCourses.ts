import type { CourseWithSignedCover } from '../../../types/course'
import { listAllCourses as listAllCoursesFromDb } from '../../repositories/courseRepo'
import { createSignedCoverUrl } from '../../storage/courseCovers'

const SIGNED_URL_EXPIRES_SEC = 3600

export async function listAllCourses(client: any): Promise<CourseWithSignedCover[]> {
  const courses = await listAllCoursesFromDb(client)

  return Promise.all(
    courses.map(async (course) => {
      const cover_url_signed = course.cover_url
        ? await createSignedCoverUrl(client, course.cover_url, SIGNED_URL_EXPIRES_SEC)
        : null
      return { ...(course as any), cover_url_signed }
    }),
  )
}
