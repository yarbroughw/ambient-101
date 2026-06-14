import { describe, expect, it } from 'vitest'
import {
  adaptPatternForLockMelodyTempoChange,
  applyPlaybackTiming,
  canStepPaceScale,
  composedBpmFromDisplay,
  formatDisplayBpm,
  formatDisplayLoopDuration,
  loopDurationMsFromDisplay,
  playbackLoopDurationSec,
  snapDisplayLoopDuration,
  formatPaceScale,
  stepPaceScale,
} from './globalPace'
import { bpmForFill, melodyFill, melodyWindowDuration } from './gridLayout'
import { createTestPattern } from '../test/fixtures'

describe('applyPlaybackTiming', () => {
  it('scales cooldown and bpm when melody tempo is unlocked', () => {
    const pattern = createTestPattern({ loopDurationMs: 10000, bpm: 100 })
    const effective = applyPlaybackTiming(pattern, {
      paceScale: 1.2,
      lockMelodyTempo: false,
    })

    expect(effective.loopDurationSec).toBe(10 / 1.2)
    expect(effective.bpm).toBe(120)
  })

  it('scales cooldown only when melody tempo is locked', () => {
    const pattern = createTestPattern({ loopDurationMs: 10000, bpm: 100 })
    const effective = applyPlaybackTiming(pattern, {
      paceScale: 1.2,
      lockMelodyTempo: true,
    })

    expect(effective.loopDurationSec).toBe(10 / 1.2)
    expect(effective.bpm).toBe(100)
  })

  it('does not clamp cooldown-only pace to the melody grid floor', () => {
    const pattern = createTestPattern({ loopDurationMs: 7000, bpm: 72 })
    const effective = applyPlaybackTiming(pattern, {
      paceScale: 1.2,
      lockMelodyTempo: true,
    })

    expect(effective.loopDurationSec).toBeCloseTo(7 / 1.2)
  })

  it('lets a shortened loop play seamlessly below the 2s tape floor', () => {
    // 12 steps at 120 BPM is a 1.5s window — under the usual 2s floor.
    const window = melodyWindowDuration(120, 12)
    const pattern = createTestPattern({
      loopDurationMs: Math.round(window * 1000),
      bpm: 120,
      loopCols: 12,
    })
    const effective = applyPlaybackTiming(pattern, {
      paceScale: 1,
      lockMelodyTempo: false,
    })

    expect(window).toBeLessThan(2)
    expect(effective.loopDurationSec).toBeCloseTo(window)
    expect(effective.bpm).toBeCloseTo(120)
  })
})

describe('seamless (100% fill) under pace', () => {
  it('keeps the melody window equal to the period for a non-integer bpm', () => {
    // 7s seamless reel needs bpm 480/7 (not an integer).
    const pattern = createTestPattern({
      loopDurationMs: 7000,
      bpm: bpmForFill(7, 1),
    })
    const effective = applyPlaybackTiming(pattern, {
      paceScale: 1.2,
      lockMelodyTempo: false,
    })

    expect(melodyWindowDuration(effective.bpm)).toBeCloseTo(
      effective.loopDurationSec,
    )
  })

  it('does not round bpm to an integer in the playback path', () => {
    const pattern = createTestPattern({
      loopDurationMs: 7000,
      bpm: bpmForFill(7, 1),
    })
    const effective = applyPlaybackTiming(pattern, {
      paceScale: 1,
      lockMelodyTempo: false,
    })

    expect(melodyWindowDuration(effective.bpm)).toBeCloseTo(7)
    expect(effective.bpm).not.toBe(Math.round(effective.bpm))
  })
})

describe('snapDisplayLoopDuration', () => {
  it('snaps to 0.1 second steps for dial drag', () => {
    expect(snapDisplayLoopDuration(6.04)).toBe(6)
    expect(snapDisplayLoopDuration(6.05)).toBe(6.1)
    expect(snapDisplayLoopDuration(10.96)).toBe(11)
  })
})

describe('formatDisplayLoopDuration', () => {
  it('shows two decimal places', () => {
    expect(formatDisplayLoopDuration(5.833333)).toBe('5.83')
    expect(formatDisplayLoopDuration(10)).toBe('10.00')
    expect(formatDisplayLoopDuration(6.363636)).toBe('6.36')
  })
})

describe('formatDisplayBpm', () => {
  it('rounds to the nearest whole number', () => {
    expect(formatDisplayBpm(105.6)).toBe(106)
    expect(formatDisplayBpm(96)).toBe(96)
  })
})

describe('loopDurationMsFromDisplay', () => {
  it('stores display seconds with a single integer round-trip', () => {
    expect(loopDurationMsFromDisplay(5.8, 120)).toBe(6960)
  })

  it('round-trips typed display duration at half pace', () => {
    const paceHundredths = 50
    const displaySec = 4.1
    const storedMs = loopDurationMsFromDisplay(displaySec, paceHundredths)
    expect(storedMs).toBe(2050)
    const playback = playbackLoopDurationSec(storedMs, paceHundredths)
    expect(playback).toBe(4.1)
    expect(formatDisplayLoopDuration(playback)).toBe('4.10')
  })
})

describe('composedBpmFromDisplay', () => {
  it('inverts display bpm when melody tempo is unlocked', () => {
    expect(
      composedBpmFromDisplay(106, { paceScale: 1.1, lockMelodyTempo: false }),
    ).toBe(96)
  })

  it('passes through display bpm when melody tempo is locked', () => {
    expect(
      composedBpmFromDisplay(106, { paceScale: 1.1, lockMelodyTempo: true }),
    ).toBe(106)
  })
})

describe('applyPlaybackTiming display values', () => {
  it('updates cooldown display at pace while leaving bpm unchanged when locked', () => {
    const pattern = createTestPattern({ loopDurationMs: 10000, bpm: 96 })
    const effective = applyPlaybackTiming(pattern, {
      paceScale: 1.2,
      lockMelodyTempo: true,
    })

    expect(formatDisplayLoopDuration(effective.loopDurationSec)).toBe('8.33')
    expect(formatDisplayBpm(effective.bpm)).toBe(96)
  })

  it('updates both cooldown and bpm display when melody tempo is unlocked', () => {
    const pattern = createTestPattern({ loopDurationMs: 10000, bpm: 96 })
    const effective = applyPlaybackTiming(pattern, {
      paceScale: 1.1,
      lockMelodyTempo: false,
    })

    expect(formatDisplayLoopDuration(effective.loopDurationSec)).toBe('9.09')
    expect(formatDisplayBpm(effective.bpm)).toBe(106)
  })
})

describe('adaptPatternForLockMelodyTempoChange', () => {
  it('keeps heard melody speed when locking tempo', () => {
    const pattern = createTestPattern({ loopDurationMs: 10000, bpm: 96 })
    const next = adaptPatternForLockMelodyTempoChange(
      pattern,
      { paceScale: 1.2, lockMelodyTempo: true },
      false,
    )

    expect(next.bpm).toBeCloseTo(115.2)
    const timing = applyPlaybackTiming(next, {
      paceScale: 1.2,
      lockMelodyTempo: true,
    })
    expect(timing.bpm).toBeCloseTo(115.2)
  })

  it('keeps fill when unlocking tempo', () => {
    const pattern = createTestPattern({ loopDurationMs: 10000, bpm: 115.2 })
    const lockedTiming = applyPlaybackTiming(pattern, {
      paceScale: 1.2,
      lockMelodyTempo: true,
    })
    const lockedFill = melodyFill(
      lockedTiming.loopDurationSec,
      lockedTiming.bpm,
    )

    const next = adaptPatternForLockMelodyTempoChange(
      pattern,
      { paceScale: 1.2, lockMelodyTempo: false },
      true,
    )
    const unlockedTiming = applyPlaybackTiming(next, {
      paceScale: 1.2,
      lockMelodyTempo: false,
    })
    expect(
      melodyFill(unlockedTiming.loopDurationSec, unlockedTiming.bpm),
    ).toBeCloseTo(lockedFill)
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
  it('allows speeding up low-fill loops when melody tempo is locked', () => {
    const patterns = [
      createTestPattern({ id: 'bass', label: 'bass', loopDurationMs: 12000, bpm: 72 }),
      createTestPattern({
        id: 'melody1',
        label: 'melody1',
        loopDurationMs: 16000,
        bpm: 96,
      }),
      createTestPattern({
        id: 'melody2',
        label: 'melody2',
        loopDurationMs: 14000,
        bpm: 88,
      }),
    ]

    expect(canStepPaceScale(patterns, 1, 'up', true)).toBe(true)
  })

  it('blocks slowing down when cooldown would exceed the max', () => {
    const patterns = [createTestPattern({ loopDurationMs: 55000, bpm: 96 })]
    expect(canStepPaceScale(patterns, 1, 'down', true)).toBe(false)
  })

  it('blocks speeding up when a seamless loop would exceed 100% fill', () => {
    const patterns = [
      createTestPattern({
        loopDurationMs: 7000,
        bpm: bpmForFill(7, 1),
      }),
    ]

    expect(canStepPaceScale(patterns, 1, 'up', true)).toBe(false)
  })
})
