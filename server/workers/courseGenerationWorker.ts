import { Worker } from 'bullmq'
import { COURSE_GENERATION_QUEUE, type CourseGenerationJobData } from '../queues/courseGenerationQueue'

export function createCourseGenerationWorker() {
  const { redisUrl } = useRuntimeConfig()

  return new Worker<CourseGenerationJobData>(
    COURSE_GENERATION_QUEUE,
    async (job) => {
      const { courseId } = job.data
      console.log(`[course-generation] Processing job ${job.id} for course ${courseId}`)

      // TODO: implement generation pipeline
      // 1. Fetch course + PDFs from DB
      // 2. Download PDF files from storage
      // 3. Send to Gemini for structure generation (update status → 'generating_structure')
      // 4. Persist generated modules/lessons/exercises
      // 5. Update status → 'ready'
      //
      // On failure, catch and update status → 'failed' with error message
    },
    {
      connection: { url: redisUrl },
    },
  )
}
