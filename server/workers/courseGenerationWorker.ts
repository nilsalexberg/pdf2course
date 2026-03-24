import { Worker } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { COURSE_GENERATION_QUEUE, type CourseGenerationJobData } from '../queues/courseGenerationQueue'
import { processCourseGeneration } from '../services/courses/processCourseGeneration'

export function createCourseGenerationWorker() {
  const { redisUrl, supabaseServiceKey, public: { supabaseUrl } } = useRuntimeConfig()

  return new Worker<CourseGenerationJobData>(
    COURSE_GENERATION_QUEUE,
    async (job) => {
      const { courseId } = job.data
      console.log(`[course-generation] Processing job ${job.id} for course ${courseId}`)

      const adminClient = createClient(supabaseUrl as string, supabaseServiceKey as string)

      try {
        await processCourseGeneration(courseId, adminClient)
      }
      catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[course-generation] Job ${job.id} failed for course ${courseId}: ${message}`)
        throw err
      }
    },
    {
      connection: { url: redisUrl },
    },
  )
}
