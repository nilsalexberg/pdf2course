import type { CourseWithSignedCover } from '../../../types/course';
import { getCourseById } from '../../repositories/courseRepo';
import { createSignedCoverUrl } from '../../storage/courseCovers';

const SIGNED_URL_EXPIRES_SEC = 3600;

export async function getCourse(id: string): Promise<CourseWithSignedCover> {
  const course = await getCourseById(id);
  if (!course) throw createError({ statusCode: 404, statusMessage: 'Course not found' });
  const cover_url_signed = course.cover_url
    ? await createSignedCoverUrl(course.cover_url, SIGNED_URL_EXPIRES_SEC)
    : null;
  return { ...course, cover_url_signed };
}
