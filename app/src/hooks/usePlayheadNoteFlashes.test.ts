import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { usePlayheadNoteFlashes } from './usePlayheadNoteFlashes'
import { createTestNote } from '../test/fixtures'

describe('usePlayheadNoteFlashes', () => {
  it('flashes a column-0 note when the playhead advances from zero', () => {
    const notes = [createTestNote({ scaleStep: 0, startCol: 0, spanCols: 1 })]
    const { result, rerender } = renderHook(
      ({ loopTimeSec }: { loopTimeSec: number }) =>
        usePlayheadNoteFlashes(loopTimeSec, notes, 120, 8, true, null),
      { initialProps: { loopTimeSec: 0 } },
    )

    expect(result.current).toEqual({})

    rerender({ loopTimeSec: 0.05 })

    expect(Object.keys(result.current)).toHaveLength(1)
  })

  it('does not backfill a column-0 flash after a mid-playback mount jump', () => {
    const notes = [createTestNote({ scaleStep: 0, startCol: 0, spanCols: 1 })]
    const { result, rerender } = renderHook(
      ({ loopTimeSec }: { loopTimeSec: number }) =>
        usePlayheadNoteFlashes(loopTimeSec, notes, 120, 8, true, null),
      { initialProps: { loopTimeSec: 0 } },
    )

    rerender({ loopTimeSec: 1.35 })

    expect(result.current).toEqual({})
  })

  it('flashes a column-0 note on the first enabled frame with a negative seed', () => {
    const notes = [createTestNote({ scaleStep: 0, startCol: 0, spanCols: 1 })]
    const { result, rerender } = renderHook(
      ({ loopTimeSec }: { loopTimeSec: number }) =>
        usePlayheadNoteFlashes(loopTimeSec, notes, 120, 8, true, -1e-6),
      { initialProps: { loopTimeSec: 0 } },
    )

    rerender({ loopTimeSec: 0.01 })

    expect(Object.keys(result.current)).toHaveLength(1)
  })
})
