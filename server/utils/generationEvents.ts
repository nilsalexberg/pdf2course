import { EventEmitter } from 'node:events'
import type { GenerationStatus } from '../../types/course'

// Module-level singleton — the Nitro HTTP handlers and the BullMQ worker run in
// the same Node.js process, so this emitter is shared between both.
const emitter = new EventEmitter()
emitter.setMaxListeners(0) // allow many concurrent SSE connections

export interface GenerationStatusEvent {
  status: GenerationStatus
  error: string | null
}

export function emitGenerationStatus(courseId: string, status: GenerationStatus, error: string | null = null) {
  emitter.emit(`course:${courseId}`, { status, error } satisfies GenerationStatusEvent)
}

export function onGenerationStatus(
  courseId: string,
  listener: (data: GenerationStatusEvent) => void,
): () => void {
  emitter.on(`course:${courseId}`, listener)
  return () => emitter.off(`course:${courseId}`, listener)
}
