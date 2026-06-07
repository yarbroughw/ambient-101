import { describe, expect, it } from 'vitest'
import { melodyBounds } from './patternTypes'
import { createTestNote } from '../test/fixtures'

describe('melodyBounds', () => {
  it('returns zeros for empty notes', () => {
    expect(melodyBounds([])).toEqual({ start: 0, end: 0, span: 0 })
  })

  it('computes bounds for a single note', () => {
    expect(melodyBounds([createTestNote({ scaleStep: 0, startCol: 4, spanCols: 2 })])).toEqual({
      start: 4,
      end: 6,
      span: 2,
    })
  })

  it('computes bounds across multiple notes', () => {
    const notes = [
      createTestNote({ scaleStep: 0, startCol: 8, spanCols: 2 }),
      createTestNote({ scaleStep: 1, startCol: 2, spanCols: 4 }),
    ]
    expect(melodyBounds(notes)).toEqual({
      start: 2,
      end: 10,
      span: 8,
    })
  })
})
