import type { LoopPattern, PatternNote } from '../audio/patternTypes'

const STORAGE_KEY = 'ambient-101:loops'
const STORAGE_VERSION = 1

type PersistedLoops = {
  version: number
  loops: LoopPattern[]
}

function isPatternNote(value: unknown): value is PatternNote {
  if (!value || typeof value !== 'object') {
    return false
  }

  const note = value as PatternNote
  return (
    typeof note.scaleStep === 'number' &&
    Number.isFinite(note.scaleStep) &&
    typeof note.startTime === 'number' &&
    Number.isFinite(note.startTime) &&
    typeof note.duration === 'number' &&
    Number.isFinite(note.duration) &&
    (note.velocity === undefined ||
      (typeof note.velocity === 'number' && Number.isFinite(note.velocity)))
  )
}

function isLoopPattern(value: unknown): value is LoopPattern {
  if (!value || typeof value !== 'object') {
    return false
  }

  const pattern = value as LoopPattern
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
    typeof pattern.octaveShift === 'number' &&
    Number.isFinite(pattern.octaveShift) &&
    typeof pattern.instrument === 'string' &&
    pattern.instrument.length > 0 &&
    typeof pattern.volume === 'number' &&
    Number.isFinite(pattern.volume) &&
    Array.isArray(pattern.notes) &&
    pattern.notes.every(isPatternNote)
  )
}

function normalizePattern(pattern: LoopPattern): LoopPattern {
  return {
    ...pattern,
    volume: Math.min(1, Math.max(0, pattern.volume)),
    notes: pattern.notes.map((note) => ({
      ...note,
      velocity: note.velocity ?? 1,
    })),
  }
}

function parseStoredLoops(raw: string): LoopPattern[] {
  const parsed: unknown = JSON.parse(raw)

  if (Array.isArray(parsed)) {
    return parsed.filter(isLoopPattern).map(normalizePattern)
  }

  if (!parsed || typeof parsed !== 'object') {
    return []
  }

  const stored = parsed as Partial<PersistedLoops>
  if (!Array.isArray(stored.loops)) {
    return []
  }

  return stored.loops.filter(isLoopPattern).map(normalizePattern)
}

export function loadLoopPatterns(): LoopPattern[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    return parseStoredLoops(raw)
  } catch {
    return []
  }
}

export function saveLoopPatterns(patterns: LoopPattern[]): void {
  const payload: PersistedLoops = {
    version: STORAGE_VERSION,
    loops: patterns.map((pattern) => ({
      ...pattern,
      notes: pattern.notes.map((note) => ({ ...note })),
    })),
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore quota / private-mode failures.
  }
}
