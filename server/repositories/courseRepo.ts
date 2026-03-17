import { createError } from 'h3'
import type { Course } from '../../types/course'

export async function listCoursesByProducerId(client: any, producerId: string): Promise<Course[]> {
  const { data: courses, error } = await client
    .from('courses')
    .select('*')
    .eq('producer_id', producerId)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return (courses ?? []) as Course[]
}

export async function insertCourse(
  client: any,
  input: { producer_id: string; title: string; description: string | null; cover_url: string | null; config: any },
): Promise<Course> {
  const { data: course, error } = await client
    .from('courses')
    .insert(input)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return course as Course
}

export async function updateCourseCoverUrl(client: any, courseId: string, coverUrl: string | null): Promise<void> {
  const { error } = await client.from('courses').update({ cover_url: coverUrl }).eq('id', courseId)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

