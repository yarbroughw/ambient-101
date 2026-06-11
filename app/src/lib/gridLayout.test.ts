import { describe, expect, it } from 'vitest'
import { createTestNote } from '../test/fixtures'
import {
  GRID_COLUMN_COUNT,
  bpmForFill,
  cellStartTime,
  clampLoopCols,
  columnAtClientX,
  createGridNote,
  createNoteSpan,
  findNoteAt,
  gridLayout,
  gridPlayheadRatio,
  melodyFill,
  melodyWindowDuration,
  migrateLegacyNote,
  minBpmForLoopDuration,
  minFillForLoopDuration,
  minLoopDurationForBpm,
  moveNote,
  noteCoversCell,
  noteDurationSec,
  noteEndColumn,
  noteFitsGrid,
  noteKey,
  noteStartTime,
  patternFitsGrid,
  placeNoteSpan,
  removeNote,
  replaceRowNotesInSpan,
  resizeNoteEnd,
  resizeNoteStart,
  rowAtClientY,
  stepDurationSec,
} from './gridLayout'

describe('stepDurationSec', () => {
  it.each([
    [120, 0.125],
    [60, 0.25],
    [240, 0.0625],
  ])('returns 16th-note step at %i BPM', (bpm, expected) => {
    expect(stepDurationSec(bpm)).toBeCloseTo(expected)
  })
})

describe('melodyWindowDuration', () => {
  it('spans two bars of 16th notes at the given BPM', () => {
    expect(melodyWindowDuration(120)).toBeCloseTo(4)
    expect(melodyWindowDuration(60)).toBeCloseTo(8)
  })

  it('shrinks proportionally when fewer loop columns are active', () => {
    // 12 of 32 steps -> 12 * (1/8s) = 1.5s at 120 BPM.
    expect(melodyWindowDuration(120, 12)).toBeCloseTo(1.5)
    expect(melodyWindowDuration(120, 16)).toBeCloseTo(2)
  })
})

describe('clampLoopCols', () => {
  it('clamps to the 1..32 range and rounds', () => {
    expect(clampLoopCols(0)).toBe(1)
    expect(clampLoopCols(100)).toBe(32)
    expect(clampLoopCols(11.6)).toBe(12)
    expect(clampLoopCols(Number.NaN)).toBe(32)
  })
})

describe('minLoopDurationForBpm', () => {
  it('matches the melody grid window', () => {
    expect(minLoopDurationForBpm(120)).toBe(melodyWindowDuration(120))
  })
})

describe('minBpmForLoopDuration', () => {
  it('returns 1 when loop duration is non-positive', () => {
    expect(minBpmForLoopDuration(0)).toBe(1)
    expect(minBpmForLoopDuration(-5)).toBe(1)
  })

  it('computes BPM floor from loop length', () => {
    expect(minBpmForLoopDuration(8)).toBeCloseTo(60)
  })
})

describe('gridLayout', () => {
  it('returns consistent step and duration values', () => {
    const layout = gridLayout(120)
    expect(layout.columnCount).toBe(GRID_COLUMN_COUNT)
    expect(layout.stepSec).toBe(stepDurationSec(120))
    expect(layout.gridDuration).toBe(melodyWindowDuration(120))
  })
})

describe('cellStartTime', () => {
  it('multiplies column index by step duration', () => {
    expect(cellStartTime(4, 0.125)).toBeCloseTo(0.5)
  })
})

describe('noteStartTime and noteDurationSec', () => {
  const note = createTestNote({ scaleStep: 0, startCol: 8, spanCols: 2 })

  it('derives start time from column and BPM', () => {
    expect(noteStartTime(note, 120)).toBeCloseTo(1)
  })

  it('derives duration from span and BPM', () => {
    expect(noteDurationSec(note, 120)).toBeCloseTo(0.25)
  })
})

describe('gridPlayheadRatio', () => {
  it.each([
    [4, 8, 0.5],
    [0, 8, 0],
  ])('returns ratio for in-window time %i / %i', (loopTimeSec, gridDuration, expected) => {
    expect(gridPlayheadRatio(loopTimeSec, gridDuration)).toBe(expected)
  })

  it('returns null when grid duration is non-positive', () => {
    expect(gridPlayheadRatio(1, 0)).toBeNull()
  })

  it('returns 0 for negative loop time', () => {
    expect(gridPlayheadRatio(-1, 8)).toBe(0)
  })

  it('returns null when loop time is at or past grid end', () => {
    expect(gridPlayheadRatio(8, 8)).toBeNull()
    expect(gridPlayheadRatio(10, 8)).toBeNull()
  })
})

describe('columnAtClientX', () => {
  const metrics = {
    columnCount: GRID_COLUMN_COUNT,
    labelWidth: 40,
    cellSize: 10,
    gap: 2,
  }

  it('returns 0 when pointer is in the label area', () => {
    expect(columnAtClientX(50, { left: 100 }, metrics)).toBe(0)
  })

  it('maps pointer position to column index', () => {
    expect(columnAtClientX(100 + 40 + 2 + 12, { left: 100 }, metrics)).toBe(1)
  })

  it('clamps to the last column', () => {
    expect(columnAtClientX(10000, { left: 100 }, metrics)).toBe(GRID_COLUMN_COUNT - 1)
  })
})

describe('noteKey and noteEndColumn', () => {
  const note = createTestNote({ scaleStep: 3, startCol: 5, spanCols: 4 })

  it('builds a stable note key', () => {
    expect(noteKey(note)).toBe('3:5')
  })

  it('computes inclusive end column', () => {
    expect(noteEndColumn(note)).toBe(8)
  })
})

describe('findNoteAt', () => {
  const notes = [
    createTestNote({ scaleStep: 0, startCol: 0, spanCols: 4 }),
    createTestNote({ scaleStep: 2, startCol: 8, spanCols: 2 }),
  ]

  it('finds a note covering the cell', () => {
    expect(findNoteAt(notes, 0, 2)).toEqual(notes[0])
  })

  it('returns undefined when no note covers the cell', () => {
    expect(findNoteAt(notes, 0, 10)).toBeUndefined()
  })
})

describe('createNoteSpan', () => {
  it('normalizes reversed column order', () => {
    expect(createNoteSpan(1, 5, 2)).toEqual({
      scaleStep: 1,
      startCol: 2,
      spanCols: 4,
      velocity: 0.7,
    })
  })
})

describe('replaceRowNotesInSpan', () => {
  const notes = [
    createTestNote({ scaleStep: 0, startCol: 0, spanCols: 4 }),
    createTestNote({ scaleStep: 0, startCol: 8, spanCols: 2 }),
    createTestNote({ scaleStep: 2, startCol: 4, spanCols: 2 }),
  ]

  it('removes overlapping notes on the same row', () => {
    const replacement = createTestNote({ scaleStep: 0, startCol: 2, spanCols: 3 })
    const result = replaceRowNotesInSpan(notes, 0, 2, 4, replacement)
    expect(result).toHaveLength(3)
    expect(result).toContainEqual(notes[1])
    expect(result).toContainEqual(notes[2])
    expect(result).toContainEqual(replacement)
  })

  it('returns kept notes when replacement is null', () => {
    const result = replaceRowNotesInSpan(notes, 0, 0, 4, null)
    expect(result).toEqual([notes[1], notes[2]])
  })
})

describe('removeNote', () => {
  it('removes the matching note by key', () => {
    const note = createTestNote({ scaleStep: 1, startCol: 3, spanCols: 2 })
    const other = createTestNote({ scaleStep: 2, startCol: 0, spanCols: 1 })
    expect(removeNote([note, other], note)).toEqual([other])
  })
})

describe('resizeNoteEnd', () => {
  const note = createTestNote({ scaleStep: 0, startCol: 4, spanCols: 2 })

  it('extends note span to the requested end column', () => {
    const result = resizeNoteEnd([note], note, 8)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ startCol: 4, spanCols: 5 })
  })

  it('clamps end column to grid bounds', () => {
    const result = resizeNoteEnd([note], note, 100)
    expect(result[0]?.spanCols).toBe(GRID_COLUMN_COUNT - note.startCol)
  })
})

describe('resizeNoteStart', () => {
  const note = createTestNote({ scaleStep: 0, startCol: 4, spanCols: 2 })

  it('extends note span to the requested start column', () => {
    const result = resizeNoteStart([note], note, 1)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ startCol: 1, spanCols: 5 })
  })

  it('clamps start column to grid bounds', () => {
    const result = resizeNoteStart([note], note, -5)
    expect(result[0]).toMatchObject({ startCol: 0, spanCols: 6 })
  })
})

describe('moveNote', () => {
  const note = createTestNote({ scaleStep: 0, startCol: 4, spanCols: 2 })
  const other = createTestNote({ scaleStep: 2, startCol: 0, spanCols: 1 })

  it('moves a note to a new column and row', () => {
    const result = moveNote([note, other], note, 8, 2)
    expect(result).toHaveLength(2)
    expect(result).toContainEqual({
      scaleStep: 2,
      startCol: 8,
      spanCols: 2,
      velocity: 0.7,
    })
  })

  it('clamps position to grid bounds', () => {
    const result = moveNote([note], note, 100, 20)
    expect(result[0]).toMatchObject({
      startCol: GRID_COLUMN_COUNT - note.spanCols,
      scaleStep: 11,
    })
  })
})

describe('rowAtClientY', () => {
  const metrics = {
    columnCount: GRID_COLUMN_COUNT,
    labelWidth: 40,
    cellSize: 10,
    gap: 2,
    headerHeight: 14,
    rowCount: 5,
  }

  it('returns null above the first data row', () => {
    expect(rowAtClientY(100, { top: 100 }, metrics)).toBeNull()
  })

  it('maps pointer position to row index', () => {
    const dataTop = 100 + 14 + 2
    expect(rowAtClientY(dataTop + 12, { top: 100 }, metrics)).toBe(1)
  })

  it('returns null below the last row', () => {
    const dataTop = 100 + 14 + 2
    expect(rowAtClientY(dataTop + 100, { top: 100 }, metrics)).toBeNull()
  })
})

describe('placeNoteSpan', () => {
  it('replaces overlapping notes with a new span', () => {
    const existing = createTestNote({ scaleStep: 0, startCol: 0, spanCols: 4 })
    const result = placeNoteSpan([existing], 0, 2, 6)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ scaleStep: 0, startCol: 2, spanCols: 5 })
  })
})

describe('noteCoversCell', () => {
  const note = createTestNote({ scaleStep: 1, startCol: 4, spanCols: 3 })

  it('returns true for covered cells', () => {
    expect(noteCoversCell(note, 1, 5)).toBe(true)
  })

  it('returns false for other rows or columns', () => {
    expect(noteCoversCell(note, 2, 5)).toBe(false)
    expect(noteCoversCell(note, 1, 8)).toBe(false)
  })
})

describe('createGridNote', () => {
  it('creates a note with default velocity', () => {
    expect(createGridNote(0, 1, 2)).toEqual({
      scaleStep: 0,
      startCol: 1,
      spanCols: 2,
      velocity: 0.7,
    })
  })
})

describe('noteFitsGrid', () => {
  it('accepts valid notes', () => {
    expect(noteFitsGrid(createTestNote({ scaleStep: 0, startCol: 0, spanCols: 32 }))).toBe(true)
  })

  it('rejects out-of-range scale steps', () => {
    expect(noteFitsGrid(createTestNote({ scaleStep: 12, startCol: 0, spanCols: 1 }))).toBe(false)
    expect(noteFitsGrid(createTestNote({ scaleStep: -12, startCol: 0, spanCols: 1 }))).toBe(false)
  })

  it('rejects notes extending past the grid', () => {
    expect(noteFitsGrid(createTestNote({ scaleStep: 0, startCol: 30, spanCols: 4 }))).toBe(false)
  })

  it('rejects zero or negative span', () => {
    expect(noteFitsGrid(createTestNote({ scaleStep: 0, startCol: 0, spanCols: 0 }))).toBe(false)
  })
})

describe('patternFitsGrid', () => {
  it('requires every note to fit', () => {
    const valid = createTestNote({ scaleStep: 0, startCol: 0, spanCols: 4 })
    const invalid = createTestNote({ scaleStep: 20, startCol: 0, spanCols: 1 })
    expect(patternFitsGrid({ notes: [valid] })).toBe(true)
    expect(patternFitsGrid({ notes: [valid, invalid] })).toBe(false)
  })
})

describe('migrateLegacyNote', () => {
  it('passes through column-based notes unchanged', () => {
    const note = {
      scaleStep: 2,
      startCol: 4,
      spanCols: 3,
      velocity: 0.5,
    }
    expect(migrateLegacyNote(note, 120)).toEqual(note)
  })

  it('converts second-based notes to grid columns', () => {
    const result = migrateLegacyNote(
      { scaleStep: 0, startTime: 0.5, duration: 0.25 },
      120,
    )
    expect(result).toEqual({
      scaleStep: 0,
      startCol: 4,
      spanCols: 2,
      velocity: undefined,
    })
  })

  it('returns null for invalid legacy notes', () => {
    expect(migrateLegacyNote({ scaleStep: 0 }, 120)).toBeNull()
  })
})

describe('melodyFill', () => {
  it('is the melody window as a fraction of the tape period', () => {
    // bpm 80 -> window 6s; on a 6s tape that fully fills it (seamless).
    expect(melodyFill(6, 80)).toBeCloseTo(1)
    // On a 12s tape the same window is half the period.
    expect(melodyFill(12, 80)).toBeCloseTo(0.5)
  })
})

describe('bpmForFill', () => {
  it('inverts melodyFill: a 100% fill makes the window equal the period', () => {
    expect(bpmForFill(6, 1)).toBeCloseTo(80)
    expect(melodyWindowDuration(bpmForFill(6, 1))).toBeCloseTo(6)
  })

  it('round-trips fill through bpm for an odd, non-integer-bpm period', () => {
    // 7s seamless needs bpm 480/7 (not an integer) — the float keeps it exact.
    const bpm = bpmForFill(7, 1)
    expect(melodyWindowDuration(bpm)).toBeCloseTo(7)
    expect(melodyFill(7, bpm)).toBeCloseTo(1)
  })

  it('halves the window for a 50% fill', () => {
    const bpm = bpmForFill(8, 0.5)
    expect(melodyWindowDuration(bpm)).toBeCloseTo(4)
  })
})

describe('minFillForLoopDuration', () => {
  it('forces short loops fuller (window cannot drop below its floor)', () => {
    // 2s window floor (bpm 240) over a 6s tape => min fill 1/3.
    expect(minFillForLoopDuration(6)).toBeCloseTo(2 / 6)
    // A 2s tape can only hold a seamless melody.
    expect(minFillForLoopDuration(2)).toBe(1)
    // Long tapes can be very sparse.
    expect(minFillForLoopDuration(60)).toBeCloseTo(2 / 60)
  })
})
