import { Worker } from 'bullmq';
import {
  COURSE_GENERATION_QUEUE,
  type CourseGenerationJobData
} from '../queues/courseGenerationQueue';
import { processCourseGeneration } from '../services/courses/processCourseGeneration';

export function createCourseGenerationWorker() {
  const { redisUrl } = useRuntimeConfig();

  return new Worker<CourseGenerationJobData>(
    COURSE_GENERATION_QUEUE,
    async (job) => {
      const { courseId } = job.data;
      console.log(`[course-generation] Processing job ${job.id} for course ${courseId}`);

      try {
        await processCourseGeneration(courseId);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `[course-generation] Job ${job.id} failed for course ${courseId}: ${message}`
        );
        throw err;
      }
    },
    {
      connection: { url: redisUrl },
      lockDuration: 300_000, // 5 minutes — generation can take 2+ min
      lockRenewTime: 60_000 // renew every 60s (must be < lockDuration/2)
    }
  );
}
