import type { CourseWithSignedCover } from '../../../types/course';
import { listAllCourses as listAllCoursesFromDb } from '../../repositories/courseRepo';
import { createSignedCoverUrl } from '../../storage/courseCovers';

const SIGNED_URL_EXPIRES_SEC = 3600;

export async function listAllCourses(): Promise<CourseWithSignedCover[]> {
  const courses = await listAllCoursesFromDb();
  if (!courses) throw createError({ statusCode: 500, statusMessage: 'Failed to list all courses' });
  return Promise.all(
    courses.map(async (course) => ({
      ...course,
      coverUrlSigned: course.coverUrl
        ? await createSignedCoverUrl(course.coverUrl, SIGNED_URL_EXPIRES_SEC)
        : null
    }))
  );
}
