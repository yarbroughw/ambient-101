import type { LoopPattern, PatternNote } from '../audio/patternTypes'
import {
  GRID_SCALE_STEP_MAX,
  GRID_SCALE_STEP_MIN,
} from './scaleSteps'

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
  scaleStep: number
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
export const MELODY_BPM_MAX = 240

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

export type GridPointerMetrics = {
  columnCount: number
  labelWidth: number
  cellSize: number
  gap: number
}

export function columnAtClientX(
  clientX: number,
  gridRect: Pick<DOMRect, 'left'>,
  metrics: GridPointerMetrics,
): number {
  const { columnCount, labelWidth, cellSize, gap } = metrics
  const relativeX = clientX - gridRect.left - labelWidth - gap
  if (relativeX < 0) {
    return 0
  }

  const col = Math.floor(relativeX / (cellSize + gap))
  return Math.min(columnCount - 1, Math.max(0, col))
}

export function noteStartColumn(note: PatternNote, stepSec: number): number {
  return Math.floor(note.startTime / stepSec + 1e-9)
}

export function noteColumnSpan(note: PatternNote, stepSec: number): number {
  return Math.max(1, Math.round(note.duration / stepSec))
}

export function noteEndColumn(note: PatternNote, stepSec: number): number {
  return noteStartColumn(note, stepSec) + noteColumnSpan(note, stepSec) - 1
}

export function noteKey(note: PatternNote): string {
  return `${note.scaleStep}:${note.startTime}`
}

export function findNoteAt(
  notes: PatternNote[],
  scaleStep: number,
  col: number,
  stepSec: number,
): PatternNote | undefined {
  return notes.find((note) => noteCoversCell(note, scaleStep, col, stepSec))
}

export function createNoteSpan(
  scaleStep: number,
  startCol: number,
  endCol: number,
  stepSec: number,
  velocity = 0.7,
): PatternNote {
  const minCol = Math.min(startCol, endCol)
  const maxCol = Math.max(startCol, endCol)
  const span = maxCol - minCol + 1

  return {
    scaleStep,
    startTime: cellStartTime(minCol, stepSec),
    duration: span * stepSec,
    velocity,
  }
}

export function replaceRowNotesInSpan(
  notes: PatternNote[],
  scaleStep: number,
  startCol: number,
  endCol: number,
  stepSec: number,
  replacement: PatternNote | null,
): PatternNote[] {
  const minCol = Math.min(startCol, endCol)
  const maxCol = Math.max(startCol, endCol)

  const kept = notes.filter((note) => {
    if (note.scaleStep !== scaleStep) {
      return true
    }

    const noteStart = noteStartColumn(note, stepSec)
    const noteEnd = noteEndColumn(note, stepSec)
    return maxCol < noteStart || minCol > noteEnd
  })

  if (!replacement) {
    return kept
  }

  return [...kept, replacement]
}

export function removeNote(
  notes: PatternNote[],
  target: PatternNote,
): PatternNote[] {
  const key = noteKey(target)
  return notes.filter((note) => noteKey(note) !== key)
}

export function resizeNoteEnd(
  notes: PatternNote[],
  target: PatternNote,
  endCol: number,
  stepSec: number,
): PatternNote[] {
  const startCol = noteStartColumn(target, stepSec)
  const minEnd = startCol
  const maxEnd = GRID_COLUMN_COUNT - 1
  const clampedEnd = Math.min(maxEnd, Math.max(minEnd, endCol))
  const span = clampedEnd - startCol + 1

  const resized: PatternNote = {
    ...target,
    duration: span * stepSec,
  }

  const key = noteKey(target)
  const without = notes.filter((note) => noteKey(note) !== key)
  return replaceRowNotesInSpan(
    without,
    target.scaleStep,
    startCol,
    clampedEnd,
    stepSec,
    resized,
  )
}

export function placeNoteSpan(
  notes: PatternNote[],
  scaleStep: number,
  startCol: number,
  endCol: number,
  stepSec: number,
  velocity = 0.7,
): PatternNote[] {
  const minCol = Math.min(startCol, endCol)
  const maxCol = Math.max(startCol, endCol)
  const note = createNoteSpan(scaleStep, minCol, maxCol, stepSec, velocity)
  return replaceRowNotesInSpan(notes, scaleStep, minCol, maxCol, stepSec, note)
}

export function noteCoversCell(
  note: PatternNote,
  scaleStep: number,
  col: number,
  stepSec: number,
): boolean {
  if (note.scaleStep !== scaleStep) {
    return false
  }

  const cellStart = cellStartTime(col, stepSec)
  const cellEnd = cellStart + stepSec
  const noteEnd = note.startTime + note.duration

  return note.startTime < cellEnd && noteEnd > cellStart
}

export function createGridNote(
  bpm: number,
  scaleStep: number,
  startCol: number,
  spanCols: number,
  velocity = 0.7,
): PatternNote {
  const stepSec = stepDurationSec(bpm)
  return {
    scaleStep,
    startTime: cellStartTime(startCol, stepSec),
    duration: spanCols * stepSec,
    velocity,
  }
}

export function noteFitsGrid(note: PatternNote, bpm: number): boolean {
  const stepSec = stepDurationSec(bpm)
  const window = melodyWindowDuration(bpm)

  if (note.scaleStep < GRID_SCALE_STEP_MIN || note.scaleStep > GRID_SCALE_STEP_MAX) {
    return false
  }

  if (note.startTime < 0 || note.startTime + note.duration > window + 1e-9) {
    return false
  }

  const startCol = noteStartColumn(note, stepSec)
  const endCol = noteEndColumn(note, stepSec)
  return startCol >= 0 && endCol < GRID_COLUMN_COUNT
}

export function patternFitsGrid(
  pattern: Pick<LoopPattern, 'notes' | 'bpm'>,
): boolean {
  return pattern.notes.every((note) => noteFitsGrid(note, pattern.bpm))
}

