import { ensureBucket } from '../lib/storage'

const BUCKETS = ['course-covers', 'course-pdfs', 'avatars']

export default defineNitroPlugin(async () => {
  try {
    await Promise.all(BUCKETS.map(ensureBucket))
    console.log('[storage] MinIO buckets ready:', BUCKETS.join(', '))
  } catch (err) {
    console.error('[storage] Failed to ensure MinIO buckets:', err)
  }
})
