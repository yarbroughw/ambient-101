import { Scale } from 'tonal'
import { compilePatternToSink } from './compilePattern'
import { createLoopVoice } from './createPadSynth'
import { createSchedulableNoteSink } from './schedulableNoteSink'
import type { LoopPattern } from './patternTypes'
import { TapeLoop } from './tapeLoop'

const SCALE = 'C4 minor'

function scaleDegree(degree: number): string {
  const degrees = Scale.degrees(SCALE)
  return degrees(degree) ?? 'C4'
}

const bassPattern: LoopPattern = {
  id: 'bass',
  label: 'bass',
  loopDuration: 7,
  bpm: 72,
  scale: SCALE,
  instrument: 'pad',
  notes: [
    { pitch: scaleDegree(-7), startTime: 0, duration: 2.5, velocity: 0.45 },
    { pitch: scaleDegree(-5), startTime: 3.5, duration: 2, velocity: 0.35 },
  ],
}

const melody1Pattern: LoopPattern = {
  id: 'melody1',
  label: 'melody1',
  loopDuration: 11,
  bpm: 96,
  scale: SCALE,
  instrument: 'pad',
  notes: [
    { pitch: scaleDegree(2), startTime: 0, duration: 0.4, velocity: 0.5 },
    { pitch: scaleDegree(4), startTime: 2, duration: 0.5, velocity: 1 },
    { pitch: scaleDegree(5), startTime: 4.5, duration: 0.6, velocity: 0.45 },
    { pitch: scaleDegree(7), startTime: 7, duration: 0.8, velocity: 0.4 },
  ],
}

export type DemoLoop = {
  pattern: LoopPattern
  loop: TapeLoop
}

function bindPattern(pattern: LoopPattern): TapeLoop {
  const loop = new TapeLoop(pattern.label, pattern.loopDuration)
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
    .record(compilePatternToSink(pattern.notes, sink))
    .bindAudioHooks({
      silence: voice.silence,
      prepare: voice.prepare,
      getLevel: voice.getLevel,
    })

  return loop
}

export function createDemoTapeLoops(): DemoLoop[] {
  return [
    { pattern: bassPattern, loop: bindPattern(bassPattern) },
    { pattern: melody1Pattern, loop: bindPattern(melody1Pattern) },
  ]
}
