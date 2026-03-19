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

export async function getCourseById(client: any, id: string): Promise<Course> {
  const { data: course, error } = await client
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw createError({ statusCode: 404, statusMessage: 'Course not found' })
  }

  return course as Course
}

export async function updateCourse(
  client: any,
  id: string,
  input: { title: string; description: string | null; config: any },
): Promise<Course> {
  const { data: course, error } = await client
    .from('courses')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return course as Course
}

export async function deleteCourse(client: any, id: string): Promise<void> {
  const { error } = await client.from('courses').delete().eq('id', id)
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
}

