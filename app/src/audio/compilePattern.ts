import { stepToPitch } from '../lib/scaleSteps'
import type { LoopPattern } from './patternTypes'
import type { NoteSink, TapeLoopCallback } from './types'

export function compilePatternToSink(
  pattern: Pick<LoopPattern, 'notes' | 'scale' | 'octaveShift'>,
  sink: NoteSink,
): TapeLoopCallback {
  return (time) => {
    for (const note of pattern.notes) {
      sink.triggerAttackRelease(
        stepToPitch(pattern.scale, note.scaleStep, pattern.octaveShift),
        note.duration,
        time + note.startTime,
        note.velocity ?? 1,
      )
    }
  }
}
