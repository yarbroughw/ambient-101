import type { PatternNote } from '../audio/patternTypes'

/** Two bars of 16th-note steps (fixed composable window, not tied to loop duration). */
export const GRID_COLUMN_COUNT = 32

const SECONDS_PER_GRID =
  (GRID_COLUMN_COUNT * 60) / 4

export type GridLayout = {
  stepSec: number
  columnCount: number
  gridDuration: number
}

export type GridCell = {
  row: number
  col: number
  pitch: string
  startTime: number
}

export function stepDurationSec(bpm: number): number {
  return 60 / bpm / 4
}

/** Wall-clock span of the fixed grid at the given melody BPM. */
export function melodyWindowDuration(bpm: number): number {
  return SECONDS_PER_GRID / bpm
}

/** Loop duration floor: the melody grid window must fit on the tape. */
export function minLoopDurationForBpm(bpm: number): number {
  return melodyWindowDuration(bpm)
}

/**
 * BPM floor for a given loop length: tempo cannot be slow enough that the
 * 32-step grid window exceeds the tape.
 */
export function minBpmForLoopDuration(loopDuration: number): number {
  if (loopDuration <= 0) {
    return 1
  }
  return SECONDS_PER_GRID / loopDuration
}

export function gridLayout(bpm: number): GridLayout {
  const stepSec = stepDurationSec(bpm)
  const gridDuration = melodyWindowDuration(bpm)
  return {
    stepSec,
    columnCount: GRID_COLUMN_COUNT,
    gridDuration,
  }
}

export function cellStartTime(col: number, stepSec: number): number {
  return col * stepSec
}

export function gridPlayheadRatio(
  loopTimeSec: number,
  gridDuration: number,
): number | null {
  if (gridDuration <= 0) {
    return null
  }

  if (loopTimeSec < 0) {
    return 0
  }

  if (loopTimeSec >= gridDuration) {
    return null
  }

  return loopTimeSec / gridDuration
}

export function columnForTime(time: number, stepSec: number): number {
  return Math.round(time / stepSec)
}

export function noteCoversCell(
  note: PatternNote,
  pitch: string,
  col: number,
  stepSec: number,
): boolean {
  if (note.pitch !== pitch) {
    return false
  }

  const cellStart = cellStartTime(col, stepSec)
  const cellEnd = cellStart + stepSec
  const noteEnd = note.startTime + note.duration

  return note.startTime < cellEnd && noteEnd > cellStart
}

export function cellKey(pitch: string, col: number): string {
  return `${pitch}:${col}`
}

export function notesAtCell(
  notes: PatternNote[],
  pitch: string,
  col: number,
  stepSec: number,
): PatternNote[] {
  return notes.filter((note) => noteCoversCell(note, pitch, col, stepSec))
}

export function toggleNoteAtCell(
  notes: PatternNote[],
  pitch: string,
  col: number,
  stepSec: number,
  velocity = 0.7,
): PatternNote[] {
  const existing = notesAtCell(notes, pitch, col, stepSec)

  if (existing.length > 0) {
    return notes.filter((note) => !noteCoversCell(note, pitch, col, stepSec))
  }

  const startTime = cellStartTime(col, stepSec)
  return [
    ...notes,
    { pitch, startTime, duration: stepSec, velocity },
  ]
}
