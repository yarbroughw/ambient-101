import { Scale } from 'tonal'
import { createLoopVoice } from './createPadSynth'
import { createSchedulableNoteSink } from './schedulableNoteSink'
import { TapeLoop } from './tapeLoop'
import type { NoteSink, TapeLoopCallback } from './types'

const SCALE = 'C4 minor'

function scaleDegree(degree: number): string {
  const degrees = Scale.degrees(SCALE)
  return degrees(degree) ?? 'C4'
}

function patternLoopA(sink: NoteSink): TapeLoopCallback {
  return (time) => {
    sink.triggerAttackRelease(scaleDegree(-7), 2.5, time, 0.45)
    sink.triggerAttackRelease(scaleDegree(-5), 2, time + 3.5, 0.35)
  }
}

function patternLoopB(sink: NoteSink): TapeLoopCallback {
  return (time) => {
    sink.triggerAttackRelease(scaleDegree(2), 0.4, time, 0.5)
    sink.triggerAttackRelease(scaleDegree(4), 0.5, time + 2)
    sink.triggerAttackRelease(scaleDegree(5), 0.6, time + 4.5, 0.45)
    sink.triggerAttackRelease(scaleDegree(7), 0.8, time + 7, 0.4)
  }
}

function bindLoop(
  loop: TapeLoop,
  buildPattern: (sink: NoteSink) => TapeLoopCallback,
): void {
  const voice = createLoopVoice()
  const sink = createSchedulableNoteSink(
    {
      triggerAttackRelease(note, duration, time, velocity = 1) {
        voice.sink.triggerAttackRelease(note, duration, time, velocity)
      },
    },
    (id) => loop.addScheduledNote(id),
  )

  loop
    .record(buildPattern(sink))
    .bindAudioHooks({
      silence: voice.silence,
      prepare: voice.prepare,
      getLevel: voice.getLevel,
    })
}

export function createDemoTapeLoops(): {
  loopA: TapeLoop
  loopB: TapeLoop
} {
  const loopA = new TapeLoop('bass', 7)
  bindLoop(loopA, patternLoopA)

  const loopB = new TapeLoop('melody1', 11)
  bindLoop(loopB, patternLoopB)

  return { loopA, loopB }
}
