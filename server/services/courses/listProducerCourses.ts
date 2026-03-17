import type { CourseWithSignedCover } from '../../../types/course'
import { listCoursesByProducerId } from '../../repositories/courseRepo'
import { createSignedCoverUrl } from '../../storage/courseCovers'

const SIGNED_URL_EXPIRES_SEC = 3600 // 1 hour

export async function listProducerCourses(client: any, producerId: string): Promise<CourseWithSignedCover[]> {
  const courses = await listCoursesByProducerId(client, producerId)

  const result: CourseWithSignedCover[] = await Promise.all(
    courses.map(async (course) => {
      const cover_url_signed = course.cover_url
        ? await createSignedCoverUrl(client, course.cover_url, SIGNED_URL_EXPIRES_SEC)
        : null
      return { ...(course as any), cover_url_signed }
    }),
  )

  return result
}

