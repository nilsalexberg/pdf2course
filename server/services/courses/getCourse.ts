import type { CourseWithSignedCover } from '../../../types/course';
import { getCourseById } from '../../repositories/courseRepo';
import { createSignedCoverUrl } from '../../storage/courseCovers';

const SIGNED_URL_EXPIRES_SEC = 3600;

export async function getCourse(id: string): Promise<CourseWithSignedCover> {
  const course = await getCourseById(id);
  if (!course) throw createError({ statusCode: 404, statusMessage: 'Course not found' });
  const coverUrlSigned = course.coverUrl
    ? await createSignedCoverUrl(course.coverUrl, SIGNED_URL_EXPIRES_SEC)
    : null;
  return { ...course, coverUrlSigned };
}
