import type { Course } from '../../../types/course'
import type { MultipartFile } from '../../http/multipart'
import type { CourseCreateInput } from '../../validators/courseSchemas'
import { insertCourse, updateCourseCoverUrl } from '../../repositories/courseRepo'
import { buildCoverPath, uploadCourseCover, validateCoverFile } from '../../storage/courseCovers'

export async function createCourse(
  client: any,
  userId: string,
  input: CourseCreateInput,
  coverFile: MultipartFile | null,
): Promise<Course> {
  const config = { num_modules: input.num_modules, lessons_per_module: input.lessons_per_module }

  const course = await insertCourse(client, {
    producer_id: userId,
    title: input.title,
    description: input.description,
    cover_url: null,
    config,
  })

  if (!coverFile) return course

  validateCoverFile(coverFile)

  const path = buildCoverPath(userId, course.id, coverFile.filename)
  await uploadCourseCover(client, path, coverFile)
  await updateCourseCoverUrl(client, course.id, path)

  return { ...(course as any), cover_url: path }
}

