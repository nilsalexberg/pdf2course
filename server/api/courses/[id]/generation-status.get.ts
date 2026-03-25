import { createEventStream } from 'h3'
import { requireUser } from '../../../auth/requireUser'
import { onGenerationStatus } from '../../../utils/generationEvents'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const courseId = getRouterParam(event, 'id')!

  const stream = createEventStream(event)

  const off = onGenerationStatus(courseId, (data) => {
    stream.push(JSON.stringify(data)).catch(() => {})
  })

  stream.onClosed(() => off())

  return stream.send()
})
