import { describe, expect, it } from 'vitest'
import {
  loadLoopPatterns,
  parseLoopPatternsJson,
  saveLoopPatterns,
  serializeLoopPattern,
} from './loopStorage'
import { createTestPattern } from '../test/fixtures'

const STORAGE_KEY = 'ambient-101:loops'

describe('loadLoopPatterns', () => {
  it('returns empty array when storage is empty', () => {
    expect(loadLoopPatterns()).toEqual([])
  })

  it('returns empty array for malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadLoopPatterns()).toEqual([])
  })

  it('loads versioned storage format', () => {
    const pattern = createTestPattern({
      id: 'loop-a',
      label: 'loop-a',
      notes: [{ scaleStep: 0, startCol: 0, spanCols: 2, velocity: 0.8 }],
    })
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 2, loops: [pattern] }),
    )
    expect(loadLoopPatterns()).toEqual([
      {
        ...pattern,
        notes: [{ scaleStep: 0, startCol: 0, spanCols: 2, velocity: 0.8 }],
      },
    ])
  })

  it('loads legacy array format and migrates second-based notes', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: 'legacy',
          label: 'legacy',
          loopDuration: 11,
          bpm: 120,
          scale: 'minor',
          octaveShift: 0,
          instrument: 'pad',
          volume: 1,
          notes: [{ scaleStep: 0, startTime: 0.5, duration: 0.25 }],
        },
      ]),
    )
    const [pattern] = loadLoopPatterns()
    expect(pattern?.notes[0]).toEqual({
      scaleStep: 0,
      startCol: 4,
      spanCols: 2,
      velocity: 1,
    })
  })

  it('filters invalid entries', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        loops: [{ id: '', label: 'bad' }],
      }),
    )
    expect(loadLoopPatterns()).toEqual([])
  })

  it('normalizes volume and effect sends to 0–1', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        loops: [
          {
            ...createTestPattern(),
            volume: 2,
            reverb: -1,
            delay: 5,
          },
        ],
      }),
    )
    const [pattern] = loadLoopPatterns()
    expect(pattern?.volume).toBe(1)
    expect(pattern?.reverb).toBe(0)
    expect(pattern?.delay).toBe(1)
  })
})

describe('parseLoopPatternsJson', () => {
  it('loads a single reel object', () => {
    const pattern = createTestPattern({
      id: 'solo',
      label: 'solo',
      notes: [{ scaleStep: 2, startCol: 4, spanCols: 2 }],
    })

    const [loaded] = parseLoopPatternsJson(JSON.stringify(pattern))
    expect(loaded).toEqual({
      ...pattern,
      notes: [{ scaleStep: 2, startCol: 4, spanCols: 2, velocity: 1 }],
    })
  })
})

describe('serializeLoopPattern', () => {
  it('round-trips through parseLoopPatternsJson', () => {
    const pattern = createTestPattern({
      id: 'shared',
      label: 'shared',
      notes: [{ scaleStep: -1, startCol: 1, spanCols: 3, velocity: 0.5 }],
    })

    const [loaded] = parseLoopPatternsJson(serializeLoopPattern(pattern))
    expect(loaded).toEqual(pattern)
  })
})

describe('saveLoopPatterns', () => {
  it('round-trips through loadLoopPatterns', () => {
    const patterns = [
      createTestPattern({
        id: 'saved',
        label: 'saved',
        notes: [{ scaleStep: 1, startCol: 2, spanCols: 3 }],
      }),
    ]
    saveLoopPatterns(patterns)
    expect(loadLoopPatterns()).toEqual([
      {
        ...patterns[0],
        notes: [{ scaleStep: 1, startCol: 2, spanCols: 3, velocity: 1 }],
      },
    ])
  })
})
