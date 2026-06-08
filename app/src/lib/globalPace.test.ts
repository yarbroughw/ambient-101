import { describe, expect, it } from 'vitest'
import {
  applyPlaybackTiming,
  canStepPaceScale,
  composedBpmFromDisplay,
  composedLoopDurationFromDisplay,
  formatDisplayBpm,
  formatDisplayLoopDuration,
  snapLoopDuration,
  formatPaceScale,
  stepPaceScale,
} from './globalPace'
import { createTestPattern } from '../test/fixtures'

describe('applyPlaybackTiming', () => {
  it('scales cooldown only by default', () => {
    const pattern = createTestPattern({ loopDuration: 10, bpm: 100 })
    const effective = applyPlaybackTiming(pattern, {
      paceScale: 1.2,
      paceAffectsMelody: false,
    })

    expect(effective.loopDuration).toBe(10 / 1.2)
    expect(effective.bpm).toBe(100)
  })

  it('scales cooldown and bpm when melody is included', () => {
    const pattern = createTestPattern({ loopDuration: 10, bpm: 100 })
    const effective = applyPlaybackTiming(pattern, {
      paceScale: 1.2,
      paceAffectsMelody: true,
    })

    expect(effective.loopDuration).toBe(10 / 1.2)
    expect(effective.bpm).toBe(120)
  })

  it('does not clamp cooldown-only pace to the melody grid floor', () => {
    const pattern = createTestPattern({ loopDuration: 7, bpm: 72 })
    const effective = applyPlaybackTiming(pattern, {
      paceScale: 1.2,
      paceAffectsMelody: false,
    })

    expect(effective.loopDuration).toBeCloseTo(7 / 1.2)
  })
})

describe('snapLoopDuration', () => {
  it('snaps to 0.1 second steps', () => {
    expect(snapLoopDuration(6.04)).toBe(6)
    expect(snapLoopDuration(6.05)).toBe(6.1)
    expect(snapLoopDuration(10.96)).toBe(11)
  })
})

describe('formatDisplayLoopDuration', () => {
  it('rounds to one decimal place', () => {
    expect(formatDisplayLoopDuration(5.833333)).toBe('5.8')
    expect(formatDisplayLoopDuration(10)).toBe('10.0')
    expect(formatDisplayLoopDuration(6.363636)).toBe('6.4')
  })
})

describe('formatDisplayBpm', () => {
  it('rounds to the nearest whole number', () => {
    expect(formatDisplayBpm(105.6)).toBe(106)
    expect(formatDisplayBpm(96)).toBe(96)
  })
})

describe('composedLoopDurationFromDisplay', () => {
  it('inverts display cooldown back to composed storage', () => {
    expect(composedLoopDurationFromDisplay(5.8, 1.2)).toBeCloseTo(6.96)
  })
})

describe('composedBpmFromDisplay', () => {
  it('inverts display bpm when melody pace is enabled', () => {
    expect(
      composedBpmFromDisplay(106, { paceScale: 1.1, paceAffectsMelody: true }),
    ).toBe(96)
  })

  it('passes through display bpm when melody pace is disabled', () => {
    expect(
      composedBpmFromDisplay(106, { paceScale: 1.1, paceAffectsMelody: false }),
    ).toBe(106)
  })
})

describe('applyPlaybackTiming display values', () => {
  it('updates cooldown display at pace while leaving bpm unchanged by default', () => {
    const pattern = createTestPattern({ loopDuration: 10, bpm: 96 })
    const effective = applyPlaybackTiming(pattern, {
      paceScale: 1.2,
      paceAffectsMelody: false,
    })

    expect(formatDisplayLoopDuration(effective.loopDuration)).toBe('8.3')
    expect(formatDisplayBpm(effective.bpm)).toBe(96)
  })

  it('updates both cooldown and bpm display when melody pace is enabled', () => {
    const pattern = createTestPattern({ loopDuration: 10, bpm: 96 })
    const effective = applyPlaybackTiming(pattern, {
      paceScale: 1.1,
      paceAffectsMelody: true,
    })

    expect(formatDisplayLoopDuration(effective.loopDuration)).toBe('9.1')
    expect(formatDisplayBpm(effective.bpm)).toBe(106)
  })
})

describe('formatPaceScale', () => {
  it('formats unity and stepped values', () => {
    expect(formatPaceScale(1)).toBe('1×')
    expect(formatPaceScale(1.2)).toBe('1.2×')
    expect(formatPaceScale(0.7)).toBe('0.7×')
  })
})

describe('stepPaceScale', () => {
  it('steps in 0.10 increments', () => {
    expect(stepPaceScale(1, 'up')).toBe(1.1)
    expect(stepPaceScale(1.1, 'down')).toBe(1)
    expect(stepPaceScale(0.9, 'up')).toBe(1)
    expect(stepPaceScale(1, 'down')).toBe(0.9)
  })
})

describe('canStepPaceScale', () => {
  it('allows speeding up demo loops in cooldown-only mode', () => {
    const patterns = [
      createTestPattern({ id: 'bass', label: 'bass', loopDuration: 7, bpm: 72 }),
      createTestPattern({ id: 'melody1', label: 'melody1', loopDuration: 11, bpm: 96 }),
      createTestPattern({ id: 'melody2', label: 'melody2', loopDuration: 10, bpm: 88 }),
    ]

    expect(canStepPaceScale(patterns, 1, 'up', false)).toBe(true)
  })

  it('blocks slowing down when cooldown would exceed the max', () => {
    const patterns = [createTestPattern({ loopDuration: 55, bpm: 96 })]
    expect(canStepPaceScale(patterns, 1, 'down', false)).toBe(false)
  })
})
