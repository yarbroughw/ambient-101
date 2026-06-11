import { describe, expect, it } from 'vitest'
import { compilePatternToSink } from './compilePattern'
import { createTestNote, createTestPattern } from '../test/fixtures'
import type { NoteSink } from './types'

type RecordedNote = {
  note: string
  duration: number
  time: number
  velocity: number
}

function createRecordingSink(): { sink: NoteSink; calls: RecordedNote[] } {
  const calls: RecordedNote[] = []
  const sink: NoteSink = {
    triggerAttackRelease(note, duration, time, velocity = 1) {
      calls.push({ note, duration, time, velocity })
    },
  }
  return { sink, calls }
}

describe('compilePatternToSink', () => {
  it('schedules notes with pitch, timing, and velocity', () => {
    const pattern = createTestPattern({
      bpm: 120,
      notes: [
        createTestNote({ scaleStep: 0, startCol: 0, spanCols: 2, velocity: 0.8 }),
        createTestNote({ scaleStep: 2, startCol: 4, spanCols: 1, velocity: 0.5 }),
      ],
    })
    const { sink, calls } = createRecordingSink()
    const callback = compilePatternToSink(pattern, sink)
    callback(0)

    expect(calls).toHaveLength(2)
    expect(calls[0]).toEqual({
      note: 'C4',
      duration: 0.25,
      time: 0,
      velocity: 0.8,
    })
    expect(calls[1]).toEqual({
      note: 'Eb4',
      duration: 0.125,
      time: 0.5,
      velocity: 0.5,
    })
  })

  it('silences notes that start beyond the active loop window', () => {
    const pattern = createTestPattern({
      bpm: 120,
      loopCols: 12,
      notes: [
        createTestNote({ scaleStep: 0, startCol: 0, spanCols: 1 }),
        createTestNote({ scaleStep: 1, startCol: 11, spanCols: 1 }),
        createTestNote({ scaleStep: 2, startCol: 12, spanCols: 1 }),
        createTestNote({ scaleStep: 3, startCol: 20, spanCols: 1 }),
      ],
    })
    const { sink, calls } = createRecordingSink()
    compilePatternToSink(pattern, sink)(0)

    // Only the notes inside the first 12 columns sound.
    expect(calls).toHaveLength(2)
    expect(calls.map((call) => call.time)).toEqual([0, 11 * 0.125])
  })
})
