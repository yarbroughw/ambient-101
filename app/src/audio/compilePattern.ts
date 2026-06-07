import { noteDurationSec, noteStartTime } from '../lib/gridLayout'
import { stepToPitch } from '../lib/scaleSteps'
import type { LoopPattern } from './patternTypes'
import type { NoteSink, TapeLoopCallback } from './types'

export function compilePatternToSink(
  pattern: Pick<LoopPattern, 'notes' | 'root' | 'scale' | 'octaveShift' | 'bpm'>,
  sink: NoteSink,
): TapeLoopCallback {
  return (time) => {
    for (const note of pattern.notes) {
      sink.triggerAttackRelease(
        stepToPitch(
          { root: pattern.root, scale: pattern.scale },
          note.scaleStep,
          pattern.octaveShift,
        ),
        noteDurationSec(note, pattern.bpm),
        time + noteStartTime(note, pattern.bpm),
        note.velocity ?? 1,
      )
    }
  }
}
