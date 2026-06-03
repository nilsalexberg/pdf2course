import { createCourseGenerationWorker } from '../workers/courseGenerationWorker';

export default defineNitroPlugin((nitroApp) => {
  const worker = createCourseGenerationWorker();

  worker.on('completed', (job) => {
    console.log(`[course-generation] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[course-generation] Job ${job?.id} failed:`, err.message);
  });

  // Catch Redis connection errors
  worker.on('error', (err) => {
    console.error(`[course-generation] Worker connection error:`, err.message);
  });

  // Graceful shutdown: prevent Redis connection leaks during Nuxt HMR
  nitroApp.hooks.hook('close', async () => {
    await worker.close();
  });
});
