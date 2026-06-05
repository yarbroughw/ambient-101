import type { LoopPattern } from './patternTypes'
import type { NoteSink, TapeLoopCallback } from './types'

export function compilePatternToSink(
  notes: LoopPattern['notes'],
  sink: NoteSink,
): TapeLoopCallback {
  return (time) => {
    for (const note of notes) {
      sink.triggerAttackRelease(
        note.pitch,
        note.duration,
        time + note.startTime,
        note.velocity ?? 1,
      )
    }
  }
}
