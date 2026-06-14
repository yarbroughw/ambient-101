import { LOOP_DELAY_DEFAULT, LOOP_REVERB_DEFAULT } from '../audio/loopEffects'
import type { LoopPattern, PatternNote } from '../audio/patternTypes'
import { normalizeInstrument } from '../audio/instruments/types'
import {
  clampLoopCols,
  DEFAULT_LOOP_COLS,
  migrateLegacyNote,
  minBpmForLoopDuration,
} from './gridLayout'
import { normalizePatternTonality, normalizeRoot } from './scaleSteps'

const STORAGE_KEY = 'ambient-101:loops'
const STORAGE_VERSION = 3

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

type StoredLoopPattern = Omit<LoopPattern, 'notes' | 'loopCols' | 'loopDurationMs'> & {
  loopCols?: number
  /** Legacy persisted field (float seconds). Migrated to loopDurationMs on load. */
  loopDuration?: number
  loopDurationMs?: number
  notes: StoredPatternNote[]
}

// Clamp bounds for optional per-reel voice overrides.
const CUTOFF_MIN_HZ = 20
const CUTOFF_MAX_HZ = 20000
const RESONANCE_MAX_Q = 30
const ENVELOPE_TIME_MAX_S = 10

function isOptionalFiniteNumber(value: unknown): boolean {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value))
}

function clampOptional(
  value: number | undefined,
  min: number,
  max: number,
): number | undefined {
  if (value === undefined) {
    return undefined
  }
  return Math.min(max, Math.max(min, value))
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
  const hasLoopDuration =
    (typeof pattern.loopDurationMs === 'number' &&
      Number.isFinite(pattern.loopDurationMs)) ||
    (typeof pattern.loopDuration === 'number' &&
      Number.isFinite(pattern.loopDuration))
  return (
    typeof pattern.id === 'string' &&
    pattern.id.length > 0 &&
    typeof pattern.label === 'string' &&
    pattern.label.length > 0 &&
    hasLoopDuration &&
    typeof pattern.bpm === 'number' &&
    Number.isFinite(pattern.bpm) &&
    (pattern.loopCols === undefined ||
      (typeof pattern.loopCols === 'number' && Number.isFinite(pattern.loopCols))) &&
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
    isOptionalFiniteNumber(pattern.cutoff) &&
    isOptionalFiniteNumber(pattern.resonance) &&
    isOptionalFiniteNumber(pattern.chorus) &&
    isOptionalFiniteNumber(pattern.attack) &&
    isOptionalFiniteNumber(pattern.release) &&
    Array.isArray(pattern.notes) &&
    pattern.notes.every(isStoredPatternNote)
  )
}

function migrateStoredNotes(notes: StoredPatternNote[], bpm: number): PatternNote[] {
  return notes
    .map((note) => migrateLegacyNote(note, bpm))
    .filter((note): note is PatternNote => note !== null)
}

function normalizePattern(
  pattern: Omit<LoopPattern, 'loopCols'> & { loopCols?: number },
): LoopPattern {
  const tonality = normalizePatternTonality(pattern.root, pattern.scale)
  const loopCols = clampLoopCols(pattern.loopCols ?? DEFAULT_LOOP_COLS)

  // Legacy reels predate the bpm floor: a melody window longer than its tape
  // (fill > 1) is now invalid, so applyPlaybackTiming clamps the played period
  // up to fit. That desyncs the timeline (tile width from stored period, scroll
  // rate from the clamped one → parallax) and locks global pace (every step
  // fails timingMatchesScale). Clamp bpm up so the window fits the loop,
  // preserving each reel's loop length and its phase relationships.
  const bpm = Math.max(
    pattern.bpm,
    minBpmForLoopDuration(pattern.loopDurationMs / 1000, loopCols),
  )

  return {
    ...pattern,
    loopCols,
    bpm,
    root: normalizeRoot(tonality.root),
    scale: tonality.scale,
    instrument: normalizeInstrument(pattern.instrument),
    volume: Math.min(1, Math.max(0, pattern.volume)),
    reverb: Math.min(1, Math.max(0, pattern.reverb ?? LOOP_REVERB_DEFAULT)),
    delay: Math.min(1, Math.max(0, pattern.delay ?? LOOP_DELAY_DEFAULT)),
    cutoff: clampOptional(pattern.cutoff, CUTOFF_MIN_HZ, CUTOFF_MAX_HZ),
    resonance: clampOptional(pattern.resonance, 0, RESONANCE_MAX_Q),
    chorus: clampOptional(pattern.chorus, 0, 1),
    attack: clampOptional(pattern.attack, 0, ENVELOPE_TIME_MAX_S),
    release: clampOptional(pattern.release, 0, ENVELOPE_TIME_MAX_S),
    notes: pattern.notes.map((note) => ({
      ...note,
      velocity: note.velocity ?? 1,
    })),
  }
}

function normalizeStoredPattern(pattern: StoredLoopPattern): LoopPattern {
  const loopDurationMs =
    typeof pattern.loopDurationMs === 'number' &&
    Number.isFinite(pattern.loopDurationMs)
      ? Math.round(pattern.loopDurationMs)
      : Math.round((pattern.loopDuration ?? 0) * 1000)

  const { loopDuration: _legacyDuration, loopDurationMs: _legacyMs, ...rest } =
    pattern

  return normalizePattern({
    ...rest,
    loopDurationMs,
    notes: migrateStoredNotes(pattern.notes, pattern.bpm),
  })
}

export function serializeLoopPattern(pattern: LoopPattern): string {
  return JSON.stringify(pattern, null, 2)
}

export function parseLoopPresetBody(
  data: unknown,
  presetId: string,
  labelFallback: string,
): LoopPattern | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const raw = data as Record<string, unknown>
  const label =
    typeof raw.label === 'string' && raw.label.length > 0 ? raw.label : labelFallback
  const candidate = { ...raw, id: presetId, label }

  if (!isStoredLoopPattern(candidate)) {
    return null
  }

  return normalizeStoredPattern(candidate)
}

export function parseLoopPatternsValue(value: unknown): LoopPattern[] {
  if (Array.isArray(value)) {
    return value.filter(isStoredLoopPattern).map(normalizeStoredPattern)
  }

  if (isStoredLoopPattern(value)) {
    return [normalizeStoredPattern(value)]
  }

  if (!value || typeof value !== 'object') {
    return []
  }

  const stored = value as Partial<PersistedLoops>
  if (!Array.isArray(stored.loops)) {
    return []
  }

  return stored.loops.filter(isStoredLoopPattern).map(normalizeStoredPattern)
}

export function parseLoopPatternsJson(raw: string): LoopPattern[] {
  return parseLoopPatternsValue(JSON.parse(raw))
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
