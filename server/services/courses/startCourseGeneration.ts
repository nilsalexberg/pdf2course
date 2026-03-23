import { createError } from 'h3'
import type { Course } from '../../../types/course'
import { GENERATION_IN_PROGRESS } from '../../../types/course'
import { getCourseById, listCoursePdfs, updateCourseGenerationStatus } from '../../repositories/courseRepo'
import { getCourseGenerationQueue } from '../../queues/courseGenerationQueue'

export async function startCourseGeneration(client: any, userId: string, courseId: string): Promise<Course> {
  const course = await getCourseById(client, courseId)

  if (course.producer_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  if (GENERATION_IN_PROGRESS.includes(course.generation_status)) {
    throw createError({ statusCode: 409, statusMessage: 'Course generation is already in progress' })
  }

  const pdfs = await listCoursePdfs(client, courseId)
  if (pdfs.length === 0) {
    throw createError({ statusCode: 422, statusMessage: 'Upload at least one PDF before generating the course' })
  }

  await getCourseGenerationQueue().add('generate', { courseId })

  const updatedCourse = await updateCourseGenerationStatus(client, courseId, 'processing')

  return updatedCourse
}
