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

export function noteStartTime(note: PatternNote, bpm: number): number {
  return note.startCol * stepDurationSec(bpm)
}

export function noteDurationSec(note: PatternNote, bpm: number): number {
  return note.spanCols * stepDurationSec(bpm)
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

export type GridRowMetrics = GridPointerMetrics & {
  headerHeight: number
  rowCount: number
}

export function rowAtClientY(
  clientY: number,
  gridRect: Pick<DOMRect, 'top'>,
  metrics: GridRowMetrics,
): number | null {
  const { cellSize, gap, headerHeight, rowCount } = metrics
  const dataTop = gridRect.top + headerHeight + gap
  const relativeY = clientY - dataTop
  if (relativeY < 0) {
    return null
  }

  const rowIndex = Math.floor(relativeY / (cellSize + gap))
  if (rowIndex < 0 || rowIndex >= rowCount) {
    return null
  }

  return rowIndex
}

export function noteEndColumn(note: PatternNote): number {
  return note.startCol + note.spanCols - 1
}

export function noteKey(note: PatternNote): string {
  return `${note.scaleStep}:${note.startCol}`
}

export function findNoteAt(
  notes: PatternNote[],
  scaleStep: number,
  col: number,
): PatternNote | undefined {
  return notes.find((note) => noteCoversCell(note, scaleStep, col))
}

export function createNoteSpan(
  scaleStep: number,
  startCol: number,
  endCol: number,
  velocity = 0.7,
): PatternNote {
  const minCol = Math.min(startCol, endCol)
  const maxCol = Math.max(startCol, endCol)

  return {
    scaleStep,
    startCol: minCol,
    spanCols: maxCol - minCol + 1,
    velocity,
  }
}

export function replaceRowNotesInSpan(
  notes: PatternNote[],
  scaleStep: number,
  startCol: number,
  endCol: number,
  replacement: PatternNote | null,
): PatternNote[] {
  const minCol = Math.min(startCol, endCol)
  const maxCol = Math.max(startCol, endCol)

  const kept = notes.filter((note) => {
    if (note.scaleStep !== scaleStep) {
      return true
    }

    const noteEnd = noteEndColumn(note)
    return maxCol < note.startCol || minCol > noteEnd
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
): PatternNote[] {
  const minEnd = target.startCol
  const maxEnd = GRID_COLUMN_COUNT - 1
  const clampedEnd = Math.min(maxEnd, Math.max(minEnd, endCol))
  const spanCols = clampedEnd - target.startCol + 1

  const resized: PatternNote = {
    ...target,
    spanCols,
  }

  const key = noteKey(target)
  const without = notes.filter((note) => noteKey(note) !== key)
  return replaceRowNotesInSpan(
    without,
    target.scaleStep,
    target.startCol,
    clampedEnd,
    resized,
  )
}

export function resizeNoteStart(
  notes: PatternNote[],
  target: PatternNote,
  startCol: number,
): PatternNote[] {
  const endCol = noteEndColumn(target)
  const clampedStart = Math.min(endCol, Math.max(0, startCol))
  const spanCols = endCol - clampedStart + 1

  const resized: PatternNote = {
    ...target,
    startCol: clampedStart,
    spanCols,
  }

  const key = noteKey(target)
  const without = notes.filter((note) => noteKey(note) !== key)
  return replaceRowNotesInSpan(
    without,
    target.scaleStep,
    clampedStart,
    endCol,
    resized,
  )
}

export function moveNote(
  notes: PatternNote[],
  target: PatternNote,
  startCol: number,
  scaleStep: number,
): PatternNote[] {
  const clampedStart = Math.min(
    GRID_COLUMN_COUNT - target.spanCols,
    Math.max(0, startCol),
  )
  const clampedScaleStep = Math.min(
    GRID_SCALE_STEP_MAX,
    Math.max(GRID_SCALE_STEP_MIN, scaleStep),
  )
  const endCol = clampedStart + target.spanCols - 1

  const moved: PatternNote = {
    ...target,
    startCol: clampedStart,
    scaleStep: clampedScaleStep,
  }

  const key = noteKey(target)
  const without = notes.filter((note) => noteKey(note) !== key)
  return replaceRowNotesInSpan(
    without,
    clampedScaleStep,
    clampedStart,
    endCol,
    moved,
  )
}

export function placeNoteSpan(
  notes: PatternNote[],
  scaleStep: number,
  startCol: number,
  endCol: number,
  velocity = 0.7,
): PatternNote[] {
  const minCol = Math.min(startCol, endCol)
  const maxCol = Math.max(startCol, endCol)
  const note = createNoteSpan(scaleStep, minCol, maxCol, velocity)
  return replaceRowNotesInSpan(notes, scaleStep, minCol, maxCol, note)
}

export function noteCoversCell(
  note: PatternNote,
  scaleStep: number,
  col: number,
): boolean {
  if (note.scaleStep !== scaleStep) {
    return false
  }

  return col >= note.startCol && col < note.startCol + note.spanCols
}

export function createGridNote(
  scaleStep: number,
  startCol: number,
  spanCols: number,
  velocity = 0.7,
): PatternNote {
  return {
    scaleStep,
    startCol,
    spanCols,
    velocity,
  }
}

export function noteFitsGrid(note: PatternNote): boolean {
  if (note.scaleStep < GRID_SCALE_STEP_MIN || note.scaleStep > GRID_SCALE_STEP_MAX) {
    return false
  }

  if (note.spanCols < 1) {
    return false
  }

  return note.startCol >= 0 && note.startCol + note.spanCols <= GRID_COLUMN_COUNT
}

export function patternFitsGrid(
  pattern: Pick<LoopPattern, 'notes'>,
): boolean {
  return pattern.notes.every((note) => noteFitsGrid(note))
}

/** Convert legacy second-based notes from persisted storage. */
export function migrateLegacyNote(
  note: {
    scaleStep: number
    startTime?: number
    duration?: number
    startCol?: number
    spanCols?: number
    velocity?: number
  },
  bpm: number,
): PatternNote | null {
  if (
    typeof note.startCol === 'number' &&
    Number.isFinite(note.startCol) &&
    typeof note.spanCols === 'number' &&
    Number.isFinite(note.spanCols)
  ) {
    return {
      scaleStep: note.scaleStep,
      startCol: note.startCol,
      spanCols: note.spanCols,
      velocity: note.velocity,
    }
  }

  if (
    typeof note.startTime !== 'number' ||
    !Number.isFinite(note.startTime) ||
    typeof note.duration !== 'number' ||
    !Number.isFinite(note.duration)
  ) {
    return null
  }

  const stepSec = stepDurationSec(bpm)
  const startCol = Math.floor(note.startTime / stepSec + 1e-9)
  const spanCols = Math.max(1, Math.round(note.duration / stepSec))

  return {
    scaleStep: note.scaleStep,
    startCol,
    spanCols,
    velocity: note.velocity,
  }
}
