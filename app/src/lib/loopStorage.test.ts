import { describe, expect, it } from 'vitest'
import {
  loadLoopPatterns,
  parseLoopPatternsJson,
  parseLoopPresetBody,
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
      JSON.stringify({ version: 3, loops: [pattern] }),
    )
    expect(loadLoopPatterns()).toEqual([
      {
        ...pattern,
        notes: [{ scaleStep: 0, startCol: 0, spanCols: 2, velocity: 0.8 }],
      },
    ])
  })

  it('migrates legacy loopDuration seconds to loopDurationMs', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        loops: [
          {
            id: 'legacy-duration',
            label: 'legacy-duration',
            loopDuration: 5,
            bpm: 72,
            scale: 'minor',
            octaveShift: 0,
            instrument: 'pad',
            volume: 1,
            notes: [],
          },
        ],
      }),
    )
    const [pattern] = loadLoopPatterns()
    expect(pattern?.loopDurationMs).toBe(5000)
  })

  it('clamps bpm up so a legacy melody window fits its tape (fill <= 1)', () => {
    // Predates the bpm floor: at 39.8 bpm the 32-col window is ~12.06s but the
    // tape is only 7s (fill ~1.72), which later clamps at playback and locks
    // pace. Migration raises bpm to 480/7 so the window equals the loop.
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 3,
        loops: [
          {
            id: 'bass',
            label: 'bass',
            bpm: 39.80099502487562,
            scale: 'harmonic major',
            octaveShift: -1,
            instrument: 'bass',
            volume: 1,
            root: 'G',
            loopCols: 32,
            loopDurationMs: 7000,
            notes: [],
          },
        ],
      }),
    )
    const [pattern] = loadLoopPatterns()
    // 480 sec-per-loop / 7s tape = 68.57… bpm floor.
    expect(pattern?.bpm).toBeCloseTo(480 / 7, 6)
    expect(pattern?.loopDurationMs).toBe(7000)
  })

  it('leaves bpm untouched when the window already fits the tape', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 3,
        loops: [
          {
            id: 'melody2',
            label: 'melody2',
            bpm: 88,
            scale: 'harmonic major',
            octaveShift: 0,
            instrument: 'pluck',
            volume: 1,
            root: 'G',
            loopCols: 32,
            loopDurationMs: 10000,
            notes: [],
          },
        ],
      }),
    )
    const [pattern] = loadLoopPatterns()
    expect(pattern?.bpm).toBe(88)
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
    expect(pattern?.loopDurationMs).toBe(11000)
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
        version: 3,
        loops: [{ id: '', label: 'bad' }],
      }),
    )
    expect(loadLoopPatterns()).toEqual([])
  })

  it('round-trips per-reel voice overrides', () => {
    const pattern = createTestPattern({
      id: 'voiced',
      label: 'voiced',
      cutoff: 3200,
      resonance: 4,
      chorus: 0.5,
      attack: 0.4,
      release: 2.5,
    })
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 3, loops: [pattern] }),
    )
    const [loaded] = loadLoopPatterns()
    expect(loaded).toMatchObject({
      cutoff: 3200,
      resonance: 4,
      chorus: 0.5,
      attack: 0.4,
      release: 2.5,
    })
  })

  it('clamps voice overrides into range', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 3,
        loops: [
          {
            ...createTestPattern(),
            cutoff: 99999,
            resonance: -2,
            chorus: 5,
            attack: -1,
            release: 999,
          },
        ],
      }),
    )
    const [pattern] = loadLoopPatterns()
    expect(pattern?.cutoff).toBe(20000)
    expect(pattern?.resonance).toBe(0)
    expect(pattern?.chorus).toBe(1)
    expect(pattern?.attack).toBe(0)
    expect(pattern?.release).toBe(10)
  })

  it('leaves voice overrides undefined when absent (recipe defaults)', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 3, loops: [createTestPattern()] }),
    )
    const [pattern] = loadLoopPatterns()
    expect(pattern?.cutoff).toBeUndefined()
    expect(pattern?.resonance).toBeUndefined()
    expect(pattern?.chorus).toBeUndefined()
    expect(pattern?.attack).toBeUndefined()
    expect(pattern?.release).toBeUndefined()
  })

  it('normalizes volume and effect sends to 0–1', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 3,
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

describe('parseLoopPresetBody', () => {
  it('parses preset JSON using the filename id and optional label', () => {
    const pattern = parseLoopPresetBody(
      {
        label: 'warm pad',
        loopDurationMs: 9000,
        bpm: 72,
        root: 'C',
        scale: 'minor',
        octaveShift: 0,
        instrument: 'pad',
        volume: 1,
        notes: [{ scaleStep: 1, startCol: 2, spanCols: 3 }],
      },
      'warm-pad',
      'warm-pad',
    )

    expect(pattern).toEqual({
      id: 'warm-pad',
      label: 'warm pad',
      loopDurationMs: 9000,
      bpm: 72,
      loopCols: 32,
      root: 'C',
      scale: 'minor',
      octaveShift: 0,
      instrument: 'pad',
      volume: 1,
      reverb: 0.75,
      delay: 0.3,
      notes: [{ scaleStep: 1, startCol: 2, spanCols: 3, velocity: 1 }],
    })
  })

  it('migrates legacy preset loopDuration seconds', () => {
    const pattern = parseLoopPresetBody(
      {
        label: 'warm pad',
        loopDuration: 9,
        bpm: 72,
        root: 'C',
        scale: 'minor',
        octaveShift: 0,
        instrument: 'pad',
        volume: 1,
        notes: [],
      },
      'warm-pad',
      'warm-pad',
    )

    expect(pattern?.loopDurationMs).toBe(9000)
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
