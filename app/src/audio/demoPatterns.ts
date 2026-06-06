import { compilePatternToSink } from './compilePattern'
import { createLoopVoice } from './createPadSynth'
import { createPluckLoopVoice } from './createPluckSynth'
import { createSchedulableNoteSink } from './schedulableNoteSink'
import { createGridNote, patternFitsGrid } from '../lib/gridLayout'
import type { LoopPattern } from './patternTypes'
import { TapeLoop } from './tapeLoop'

const SCALE = 'C4 minor'

const BASS_BPM = 72

const bassPattern: LoopPattern = {
  id: 'bass',
  label: 'bass',
  loopDuration: 7,
  bpm: BASS_BPM,
  scale: SCALE,
  octaveShift: -2,
  instrument: 'pad',
  volume: 1,
  notes: [
    createGridNote(BASS_BPM, -5, 0, 12, 0.45),
    createGridNote(BASS_BPM, -3, 17, 10, 0.35),
  ],
}

const MELODY1_BPM = 96

const melody1Template: Omit<LoopPattern, 'id' | 'label'> = {
  loopDuration: 11,
  bpm: MELODY1_BPM,
  scale: SCALE,
  octaveShift: 0,
  instrument: 'pluck',
  volume: 1,
  notes: [
    createGridNote(MELODY1_BPM, 1, 0, 2, 0.5),
    createGridNote(MELODY1_BPM, 3, 12, 3, 1),
    createGridNote(MELODY1_BPM, 4, 20, 3, 0.45),
    createGridNote(MELODY1_BPM, 6, 27, 4, 0.4),
  ],
}

const MELODY2_BPM = 88

const melody2Template: Omit<LoopPattern, 'id' | 'label'> = {
  loopDuration: 10,
  bpm: MELODY2_BPM,
  scale: SCALE,
  octaveShift: 0,
  instrument: 'pluck',
  volume: 1,
  notes: [
    createGridNote(MELODY2_BPM, 6, 0, 2, 0.55),
    createGridNote(MELODY2_BPM, 4, 9, 2, 0.65),
    createGridNote(MELODY2_BPM, 3, 18, 2, 0.5),
    createGridNote(MELODY2_BPM, 1, 26, 2, 0.45),
    createGridNote(MELODY2_BPM, 0, 30, 2, 0.4),
  ],
}

const blankTemplate: Omit<LoopPattern, 'id' | 'label'> = {
  loopDuration: 10,
  bpm: MELODY2_BPM,
  scale: SCALE,
  octaveShift: 0,
  instrument: 'pluck',
  volume: 1,
  notes: [],
}

export type LoopPresetId = 'bass' | 'melody1' | 'melody2'

export const LOOP_PRESETS: { id: LoopPresetId; label: string }[] = [
  { id: 'bass', label: 'bass' },
  { id: 'melody1', label: 'melody1' },
  { id: 'melody2', label: 'melody2' },
]

const PRESET_TEMPLATES: Record<LoopPresetId, Omit<LoopPattern, 'id' | 'label'>> = {
  bass: bassPattern,
  melody1: melody1Template,
  melody2: melody2Template,
}

for (const { id, label } of LOOP_PRESETS) {
  const pattern = instantiateTemplate(PRESET_TEMPLATES[id], id, label)
  if (!patternFitsGrid(pattern)) {
    throw new Error(`Preset pattern "${id}" exceeds grid bounds`)
  }
}

function instantiateTemplate(
  template: Omit<LoopPattern, 'id' | 'label'>,
  id: string,
  label: string,
): LoopPattern {
  return {
    id,
    label,
    ...template,
    notes: template.notes.map((note) => ({ ...note })),
  }
}

export type DemoLoop = {
  pattern: LoopPattern
  loop: TapeLoop
  rebindPattern: (pattern: LoopPattern) => void
  setVolume: (amount: number) => void
}

function createVoiceForInstrument(instrument: string) {
  if (instrument === 'pluck') {
    return createPluckLoopVoice()
  }
  return createLoopVoice()
}

function bindPattern(pattern: LoopPattern): DemoLoop {
  const loop = new TapeLoop(pattern.label, pattern.loopDuration)
  const voice = createVoiceForInstrument(pattern.instrument)
  voice.setVolume(pattern.volume ?? 1)
  const sink = createSchedulableNoteSink(
    {
      triggerAttackRelease(note, duration, time, velocity = 1) {
        voice.sink.triggerAttackRelease(note, duration, time, velocity)
      },
    },
    (id) => loop.addScheduledNote(id),
  )

  function rebindPattern(next: LoopPattern) {
    voice.setVolume(next.volume ?? 1)
    loop.record(compilePatternToSink(next, sink))
  }

  function setVolume(amount: number) {
    voice.setVolume(amount)
  }

  rebindPattern(pattern)
  loop.bindAudioHooks({
    silence: voice.silence,
    prepare: voice.prepare,
    getLevel: voice.getLevel,
  })

  return { pattern, loop, rebindPattern, setVolume }
}

export function createBlankPattern(id: string, label: string): LoopPattern {
  return instantiateTemplate(blankTemplate, id, label)
}

export function createPresetPattern(
  presetId: LoopPresetId,
  id: string,
  label: string,
): LoopPattern {
  return instantiateTemplate(PRESET_TEMPLATES[presetId], id, label)
}

export function createTapeLoop(pattern: LoopPattern): DemoLoop {
  return bindPattern(pattern)
}

export function createTapeLoopsFromPatterns(patterns: LoopPattern[]): DemoLoop[] {
  return patterns.map((pattern) => createTapeLoop(pattern))
}

export function nextAvailableIdAndLabel(
  baseLabel: string,
  loops: Pick<DemoLoop, 'pattern'>[],
): { id: string; label: string } {
  if (!labelTaken(baseLabel, loops)) {
    return { id: baseLabel, label: baseLabel }
  }

  const trailingNumber = baseLabel.match(/^(.*?)(\d+)$/)
  if (trailingNumber) {
    const base = trailingNumber[1]
    let number = Number.parseInt(trailingNumber[2], 10) + 1
    let candidate = `${base}${number}`
    while (labelTaken(candidate, loops)) {
      number += 1
      candidate = `${base}${number}`
    }
    return { id: candidate, label: candidate }
  }

  let number = 2
  let candidate = `${baseLabel}${number}`
  while (labelTaken(candidate, loops)) {
    number += 1
    candidate = `${baseLabel}${number}`
  }
  return { id: candidate, label: candidate }
}

function labelTaken(
  candidate: string,
  loops: Pick<DemoLoop, 'pattern'>[],
): boolean {
  return loops.some(
    (entry) =>
      entry.pattern.id === candidate || entry.pattern.label === candidate,
  )
}

export function nextDuplicateIdAndLabel(
  sourceLabel: string,
  loops: Pick<DemoLoop, 'pattern'>[],
): { id: string; label: string } {
  const trailingNumber = sourceLabel.match(/^(.*?)(\d+)$/)

  if (trailingNumber) {
    const base = trailingNumber[1]
    let number = Number.parseInt(trailingNumber[2], 10) + 1
    let candidate = `${base}${number}`
    while (labelTaken(candidate, loops)) {
      number += 1
      candidate = `${base}${number}`
    }
    return { id: candidate, label: candidate }
  }

  let suffix = 2
  let candidate = `${sourceLabel}-${suffix}`
  while (labelTaken(candidate, loops)) {
    suffix += 1
    candidate = `${sourceLabel}-${suffix}`
  }
  return { id: candidate, label: candidate }
}

export function duplicatePattern(
  source: LoopPattern,
  loops: Pick<DemoLoop, 'pattern'>[],
): LoopPattern {
  const { id, label } = nextDuplicateIdAndLabel(source.label, loops)
  return {
    ...source,
    id,
    label,
    notes: source.notes.map((note) => ({ ...note })),
  }
}
