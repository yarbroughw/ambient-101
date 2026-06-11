import { LOOP_DELAY_DEFAULT, LOOP_REVERB_DEFAULT } from '../audio/loopEffects'
import type { LoopPattern, PatternNote } from '../audio/patternTypes'

export function createTestNote(
  overrides: Partial<PatternNote> & Pick<PatternNote, 'scaleStep' | 'startCol' | 'spanCols'>,
): PatternNote {
  return {
    velocity: 0.7,
    ...overrides,
  }
}

export function createTestPattern(
  overrides: Partial<LoopPattern> = {},
): LoopPattern {
  return {
    id: 'test-loop',
    label: 'test-loop',
    loopDurationMs: 11000,
    bpm: 96,
    loopCols: 32,
    root: 'C',
    scale: 'minor',
    octaveShift: 0,
    instrument: 'pad',
    volume: 1,
    reverb: LOOP_REVERB_DEFAULT,
    delay: LOOP_DELAY_DEFAULT,
    notes: [],
    ...overrides,
  }
}

export function createTestLoopEntry(pattern: LoopPattern): { pattern: LoopPattern } {
  return { pattern }
}
