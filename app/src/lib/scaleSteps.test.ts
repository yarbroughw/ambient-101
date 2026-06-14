import { describe, expect, it } from 'vitest'
import { createTestPattern } from '../test/fixtures'
import {
  DEFAULT_ROOT,
  DEFAULT_SCALE_TYPE,
  MIXED_VALUE,
  clampOctaveShift,
  formatScaleStepLabel,
  globalSelectValue,
  normalizePatternTonality,
  normalizeRoot,
  parsePatternTonality,
  resolvePatternNotes,
  stepToPitch,
  tonalityLabel,
} from './scaleSteps'

describe('normalizeRoot', () => {
  it('maps pitch classes to workshop roots', () => {
    expect(normalizeRoot('Db')).toBe('Db')
    expect(normalizeRoot('C#')).toBe('Db')
  })

  it('falls back to default for invalid input', () => {
    expect(normalizeRoot('not-a-note')).toBe(DEFAULT_ROOT)
  })
})

describe('parsePatternTonality', () => {
  it('parses octave-embedded scale strings', () => {
    expect(parsePatternTonality('C4 minor')).toEqual({
      root: 'C',
      scaleType: 'minor',
    })
  })

  it('falls back to default scale type for unknown types', () => {
    expect(parsePatternTonality('D4 unknown-scale')).toEqual({
      root: 'D',
      scaleType: DEFAULT_SCALE_TYPE,
    })
  })
})

describe('normalizePatternTonality', () => {
  it('parses legacy octave-embedded scale strings', () => {
    expect(normalizePatternTonality(undefined, 'G4 dorian')).toEqual({
      root: 'G',
      scale: 'dorian',
    })
  })

  it('uses explicit root with type-only scale strings', () => {
    expect(normalizePatternTonality('F', 'lydian')).toEqual({
      root: 'F',
      scale: 'lydian',
    })
  })

  it('defaults root and scale type for bare scale names', () => {
    expect(normalizePatternTonality(undefined, 'major')).toEqual({
      root: DEFAULT_ROOT,
      scale: 'major',
    })
  })

  it('falls back for invalid scale types', () => {
    expect(normalizePatternTonality(undefined, 'not-real')).toEqual({
      root: DEFAULT_ROOT,
      scale: DEFAULT_SCALE_TYPE,
    })
  })
})

describe('tonalityLabel', () => {
  it('formats root and scale for display', () => {
    expect(tonalityLabel({ root: 'C', scale: 'minor' })).toBe('C minor')
  })
})

describe('stepToPitch', () => {
  it('returns the root pitch for scale step 0', () => {
    expect(stepToPitch({ root: 'C', scale: 'minor' }, 0)).toBe('C4')
  })

  it('steps up and down the scale', () => {
    expect(stepToPitch({ root: 'C', scale: 'minor' }, 1)).toBe('D4')
    expect(stepToPitch({ root: 'C', scale: 'minor' }, -1)).toBe('Bb3')
  })

  it('applies octave shift across scale degrees', () => {
    expect(stepToPitch({ root: 'C', scale: 'minor' }, 0, 1)).toBe('C5')
  })

  it('steps by semitone in chromatic scale', () => {
    expect(stepToPitch({ root: 'C', scale: 'chromatic' }, 0)).toBe('C4')
    expect(stepToPitch({ root: 'C', scale: 'chromatic' }, 1)).toBe('Db4')
    expect(stepToPitch({ root: 'C', scale: 'chromatic' }, -1)).toBe('B3')
  })
})

describe('formatScaleStepLabel', () => {
  it.each([
    [0, '0'],
    [3, '+3'],
    [-2, '-2'],
  ])('formats scale step %i', (step, expected) => {
    expect(formatScaleStepLabel(step)).toBe(expected)
  })
})

describe('globalSelectValue', () => {
  it('returns fallback for empty values', () => {
    expect(globalSelectValue([], 'minor')).toBe('minor')
  })

  it('returns the shared value when all match', () => {
    expect(globalSelectValue(['dorian', 'dorian'], 'minor')).toBe('dorian')
  })

  it('returns mixed when values differ', () => {
    expect(globalSelectValue(['minor', 'major'], 'minor')).toBe(MIXED_VALUE)
  })
})

describe('clampOctaveShift', () => {
  it('clamps to the allowed range', () => {
    expect(clampOctaveShift(-5)).toBe(-2)
    expect(clampOctaveShift(0)).toBe(0)
    expect(clampOctaveShift(5)).toBe(2)
  })
})

describe('resolvePatternNotes', () => {
  it('adds pitch names to each note', () => {
    const pattern = createTestPattern({
      notes: [{ scaleStep: 0, startCol: 0, spanCols: 1 }],
    })
    const resolved = resolvePatternNotes(pattern)
    expect(resolved).toHaveLength(1)
    expect(resolved[0]?.pitch).toBe('C4')
  })
})
