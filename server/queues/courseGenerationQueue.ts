import { Queue } from 'bullmq';

export const COURSE_GENERATION_QUEUE = 'course-generation';

export interface CourseGenerationJobData {
  courseId: string;
}

let queue: Queue<CourseGenerationJobData> | null = null;

export function getCourseGenerationQueue(): Queue<CourseGenerationJobData> {
  if (!queue) {
    const { redisUrl } = useRuntimeConfig();
    queue = new Queue<CourseGenerationJobData>(COURSE_GENERATION_QUEUE, {
      connection: { url: redisUrl }
    });
  }
  return queue;
}
