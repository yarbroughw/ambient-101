import { Scale } from 'tonal'
import { compilePatternToSink } from './compilePattern'
import { createLoopVoice } from './createPadSynth'
import { createPluckLoopVoice } from './createPluckSynth'
import { createSchedulableNoteSink } from './schedulableNoteSink'
import type { LoopPattern } from './patternTypes'
import { TapeLoop } from './tapeLoop'

const SCALE = 'C4 minor'

function scaleDegree(degree: number): string {
  const degrees = Scale.degrees(SCALE)
  return degrees(degree) || 'C4'
}

const bassPattern: LoopPattern = {
  id: 'bass',
  label: 'bass',
  loopDuration: 7,
  bpm: 72,
  scale: SCALE,
  instrument: 'pad',
  notes: [
    { pitch: scaleDegree(-19), startTime: 0, duration: 2.5, velocity: 0.45 },
    { pitch: scaleDegree(-17), startTime: 3.5, duration: 2, velocity: 0.35 },
  ],
}

const melody1Template: Omit<LoopPattern, 'id' | 'label'> = {
  loopDuration: 11,
  bpm: 96,
  scale: SCALE,
  instrument: 'pluck',
  notes: [
    { pitch: scaleDegree(2), startTime: 0, duration: 0.4, velocity: 0.5 },
    { pitch: scaleDegree(4), startTime: 2, duration: 0.5, velocity: 1 },
    { pitch: scaleDegree(5), startTime: 4.5, duration: 0.6, velocity: 0.45 },
    { pitch: scaleDegree(7), startTime: 7, duration: 0.8, velocity: 0.4 },
  ],
}

const melody1Pattern: LoopPattern = {
  id: 'melody1',
  label: 'melody1',
  ...melody1Template,
}

const melody2Template: Omit<LoopPattern, 'id' | 'label'> = {
  loopDuration: 10,
  bpm: 88,
  scale: SCALE,
  instrument: 'pluck',
  notes: [
    { pitch: scaleDegree(7), startTime: 0, duration: 0.25, velocity: 0.55 },
    { pitch: scaleDegree(5), startTime: 1.5, duration: 0.3, velocity: 0.65 },
    { pitch: scaleDegree(4), startTime: 3.25, duration: 0.35, velocity: 0.5 },
    { pitch: scaleDegree(2), startTime: 5.5, duration: 0.4, velocity: 0.45 },
    { pitch: scaleDegree(1), startTime: 7.75, duration: 0.7, velocity: 0.4 },
  ],
}

export type DemoLoop = {
  pattern: LoopPattern
  loop: TapeLoop
}

function createVoiceForInstrument(instrument: string) {
  if (instrument === 'pluck') {
    return createPluckLoopVoice()
  }
  return createLoopVoice()
}

function bindPattern(pattern: LoopPattern): TapeLoop {
  const loop = new TapeLoop(pattern.label, pattern.loopDuration)
  const voice = createVoiceForInstrument(pattern.instrument)
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

export function createMelody1Pattern(id: string, label: string): LoopPattern {
  return {
    id,
    label,
    ...melody1Template,
    notes: melody1Template.notes.map((note) => ({ ...note })),
  }
}

export function createMelody2Pattern(id: string, label: string): LoopPattern {
  return {
    id,
    label,
    ...melody2Template,
    notes: melody2Template.notes.map((note) => ({ ...note })),
  }
}

export function createTapeLoop(pattern: LoopPattern): DemoLoop {
  return { pattern, loop: bindPattern(pattern) }
}

export function createDemoTapeLoops(): DemoLoop[] {
  return [
    createTapeLoop(bassPattern),
    createTapeLoop(melody1Pattern),
  ]
}

export function nextMelody1IdAndLabel(
  loops: Pick<DemoLoop, 'pattern'>[],
): { id: string; label: string } {
  let index = 2
  while (loops.some((entry) => entry.pattern.id === `melody1-${index}`)) {
    index += 1
  }
  const suffix = `melody1-${index}`
  return { id: suffix, label: suffix }
}

export function nextMelody2IdAndLabel(
  loops: Pick<DemoLoop, 'pattern'>[],
): { id: string; label: string } {
  let index = 2
  while (loops.some((entry) => entry.pattern.id === `melody2-${index}`)) {
    index += 1
  }
  const suffix = `melody2-${index}`
  return { id: suffix, label: suffix }
}
