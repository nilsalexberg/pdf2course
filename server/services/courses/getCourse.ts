import type { CourseWithSignedCover } from '../../../types/course'
import { getCourseById } from '../../repositories/courseRepo'
import { createSignedCoverUrl } from '../../storage/courseCovers'

const SIGNED_URL_EXPIRES_SEC = 3600 // 1 hour

export async function getCourse(client: any, id: string): Promise<CourseWithSignedCover> {
  const course = await getCourseById(client, id)
  const cover_url_signed = course.cover_url
    ? await createSignedCoverUrl(client, course.cover_url, SIGNED_URL_EXPIRES_SEC)
    : null

  return { ...(course as any), cover_url_signed }
}
