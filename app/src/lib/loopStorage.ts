import { LOOP_DELAY_DEFAULT, LOOP_REVERB_DEFAULT } from '../audio/loopEffects'
import type { LoopPattern, PatternNote } from '../audio/patternTypes'
import { normalizeInstrument } from '../audio/instruments/types'
import { migrateLegacyNote } from './gridLayout'
import { normalizePatternTonality, normalizeRoot } from './scaleSteps'

const STORAGE_KEY = 'ambient-101:loops'
const STORAGE_VERSION = 2

export type PersistedLoops = {
  version: number
  loops: LoopPattern[]
}

type StoredPatternNote = {
  scaleStep: number
  startTime?: number
  duration?: number
  startCol?: number
  spanCols?: number
  velocity?: number
}

type StoredLoopPattern = Omit<LoopPattern, 'notes'> & {
  notes: StoredPatternNote[]
}

function isStoredPatternNote(value: unknown): value is StoredPatternNote {
  if (!value || typeof value !== 'object') {
    return false
  }

  const note = value as StoredPatternNote
  return (
    typeof note.scaleStep === 'number' &&
    Number.isFinite(note.scaleStep) &&
    (note.velocity === undefined ||
      (typeof note.velocity === 'number' && Number.isFinite(note.velocity))) &&
    ((typeof note.startCol === 'number' &&
      Number.isFinite(note.startCol) &&
      typeof note.spanCols === 'number' &&
      Number.isFinite(note.spanCols)) ||
      (typeof note.startTime === 'number' &&
        Number.isFinite(note.startTime) &&
        typeof note.duration === 'number' &&
        Number.isFinite(note.duration)))
  )
}

function isStoredLoopPattern(value: unknown): value is StoredLoopPattern {
  if (!value || typeof value !== 'object') {
    return false
  }

  const pattern = value as StoredLoopPattern
  return (
    typeof pattern.id === 'string' &&
    pattern.id.length > 0 &&
    typeof pattern.label === 'string' &&
    pattern.label.length > 0 &&
    typeof pattern.loopDuration === 'number' &&
    Number.isFinite(pattern.loopDuration) &&
    typeof pattern.bpm === 'number' &&
    Number.isFinite(pattern.bpm) &&
    typeof pattern.scale === 'string' &&
    pattern.scale.length > 0 &&
    (pattern.root === undefined ||
      (typeof pattern.root === 'string' && pattern.root.length > 0)) &&
    typeof pattern.octaveShift === 'number' &&
    Number.isFinite(pattern.octaveShift) &&
    typeof pattern.instrument === 'string' &&
    pattern.instrument.length > 0 &&
    typeof pattern.volume === 'number' &&
    Number.isFinite(pattern.volume) &&
    (pattern.reverb === undefined ||
      (typeof pattern.reverb === 'number' && Number.isFinite(pattern.reverb))) &&
    (pattern.delay === undefined ||
      (typeof pattern.delay === 'number' && Number.isFinite(pattern.delay))) &&
    Array.isArray(pattern.notes) &&
    pattern.notes.every(isStoredPatternNote)
  )
}

function migrateStoredNotes(notes: StoredPatternNote[], bpm: number): PatternNote[] {
  return notes
    .map((note) => migrateLegacyNote(note, bpm))
    .filter((note): note is PatternNote => note !== null)
}

function normalizePattern(pattern: LoopPattern): LoopPattern {
  const tonality = normalizePatternTonality(pattern.root, pattern.scale)

  return {
    ...pattern,
    root: normalizeRoot(tonality.root),
    scale: tonality.scale,
    instrument: normalizeInstrument(pattern.instrument),
    volume: Math.min(1, Math.max(0, pattern.volume)),
    reverb: Math.min(1, Math.max(0, pattern.reverb ?? LOOP_REVERB_DEFAULT)),
    delay: Math.min(1, Math.max(0, pattern.delay ?? LOOP_DELAY_DEFAULT)),
    notes: pattern.notes.map((note) => ({
      ...note,
      velocity: note.velocity ?? 1,
    })),
  }
}

function normalizeStoredPattern(pattern: StoredLoopPattern): LoopPattern {
  return normalizePattern({
    ...pattern,
    notes: migrateStoredNotes(pattern.notes, pattern.bpm),
  })
}

export function serializeLoopPattern(pattern: LoopPattern): string {
  return JSON.stringify(pattern, null, 2)
}

export function parseLoopPatternsJson(raw: string): LoopPattern[] {
  const parsed: unknown = JSON.parse(raw)

  if (Array.isArray(parsed)) {
    return parsed.filter(isStoredLoopPattern).map(normalizeStoredPattern)
  }

  if (isStoredLoopPattern(parsed)) {
    return [normalizeStoredPattern(parsed)]
  }

  if (!parsed || typeof parsed !== 'object') {
    return []
  }

  const stored = parsed as Partial<PersistedLoops>
  if (!Array.isArray(stored.loops)) {
    return []
  }

  return stored.loops.filter(isStoredLoopPattern).map(normalizeStoredPattern)
}

export function buildLoopPatternsPayload(patterns: LoopPattern[]): PersistedLoops {
  return {
    version: STORAGE_VERSION,
    loops: patterns.map((pattern) => ({
      ...pattern,
      notes: pattern.notes.map((note) => ({ ...note })),
    })),
  }
}

export function loadLoopPatterns(): LoopPattern[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    return parseLoopPatternsJson(raw)
  } catch {
    return []
  }
}

export function saveLoopPatterns(patterns: LoopPattern[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildLoopPatternsPayload(patterns)))
  } catch {
    // Ignore quota / private-mode failures.
  }
}
