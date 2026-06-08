import { compilePatternToSink } from './compilePattern'
import { LOOP_DELAY_DEFAULT, LOOP_REVERB_DEFAULT } from './loopEffects'
import { createLoopVoiceForInstrument } from './loopVoice'
import { normalizeInstrument, type InstrumentId } from './instruments/types'
import { createSchedulableNoteSink } from './schedulableNoteSink'
import type { LoopPattern } from './patternTypes'
import type { NoteSink } from './types'
import { TapeLoop } from './tapeLoop'

const ROOT = 'C'
const SCALE = 'minor'
const DEFAULT_BLANK_BPM = 88

const blankTemplate: Omit<LoopPattern, 'id' | 'label'> = {
  loopDuration: 10,
  bpm: DEFAULT_BLANK_BPM,
  root: ROOT,
  scale: SCALE,
  octaveShift: 0,
  instrument: 'pluck',
  volume: 1,
  reverb: LOOP_REVERB_DEFAULT,
  delay: LOOP_DELAY_DEFAULT,
  notes: [],
}

export function instantiatePatternFromTemplate(
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
  setReverb: (amount: number) => void
  setDelay: (amount: number) => void
}

function bindPattern(pattern: LoopPattern): DemoLoop {
  const loop = new TapeLoop(pattern.label, pattern.loopDuration)
  let activeInstrument: InstrumentId = normalizeInstrument(pattern.instrument)
  let voice = createLoopVoiceForInstrument(
    activeInstrument,
    pattern.reverb,
    pattern.delay,
  )
  voice.setVolume(pattern.volume ?? 1)

  const innerSink: NoteSink = {
    triggerAttackRelease(note, duration, time, velocity = 1) {
      voice.sink.triggerAttackRelease(note, duration, time, velocity)
    },
  }

  const sink = createSchedulableNoteSink(innerSink, (id) =>
    loop.addScheduledNote(id),
  )

  function bindVoiceHooks() {
    loop.bindAudioHooks({
      silence: voice.silence,
      prepare: voice.prepare,
      getLevel: voice.getLevel,
    })
  }

  function replaceVoice(next: LoopPattern) {
    activeInstrument = normalizeInstrument(next.instrument)
    voice.silence()
    voice = createLoopVoiceForInstrument(
      activeInstrument,
      next.reverb,
      next.delay,
    )
    voice.setVolume(next.volume ?? 1)
    bindVoiceHooks()
  }

  function rebindPattern(next: LoopPattern) {
    const nextInstrument = normalizeInstrument(next.instrument)
    if (nextInstrument !== activeInstrument) {
      replaceVoice(next)
    } else {
      voice.setVolume(next.volume ?? 1)
      voice.setReverb(next.reverb)
      voice.setDelay(next.delay)
    }
    loop.record(compilePatternToSink(next, sink))
  }

  function setVolume(amount: number) {
    voice.setVolume(amount)
  }

  function setReverb(amount: number) {
    voice.setReverb(amount)
  }

  function setDelay(amount: number) {
    voice.setDelay(amount)
  }

  rebindPattern(pattern)
  bindVoiceHooks()

  return { pattern, loop, rebindPattern, setVolume, setReverb, setDelay }
}

export function createBlankPattern(id: string, label: string): LoopPattern {
  return instantiatePatternFromTemplate(blankTemplate, id, label)
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

export function importPattern(
  source: LoopPattern,
  loops: Pick<DemoLoop, 'pattern'>[],
): LoopPattern {
  const { id, label } = nextAvailableIdAndLabel(source.label, loops)
  return {
    ...source,
    id,
    label,
    notes: source.notes.map((note) => ({ ...note })),
  }
}
