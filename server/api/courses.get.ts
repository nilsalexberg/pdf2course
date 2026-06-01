import type { CourseWithSignedCover } from '../../types/course'
import { requireRole } from '../auth/requireRole'
import { requireUser } from '../auth/requireUser'
import { listProducerCourses } from '../services/courses/listProducerCourses'

export default defineEventHandler(async (event): Promise<CourseWithSignedCover[]> => {
  const user = await requireUser(event)
  await requireRole(event, user.id)
  return listProducerCourses(user.id)
})
