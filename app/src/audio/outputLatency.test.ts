import { describe, expect, it } from 'vitest'
import {
  heardLoopProgress,
  heardLoopTimeSec,
  heardTimeSec,
} from './outputLatency'

describe('heardTimeSec', () => {
  it('subtracts latency from scheduled time', () => {
    expect(heardTimeSec(0.5, 0.16)).toBeCloseTo(0.34)
  })

  it('clamps at zero', () => {
    expect(heardTimeSec(0.1, 0.16)).toBe(0)
  })
})

describe('heardLoopTimeSec', () => {
  it('subtracts latency from scheduled loop time', () => {
    expect(heardLoopTimeSec(0.5, 8, 20, 0.16)).toBeCloseTo(0.34)
  })

  it('wraps across the loop seam instead of stalling at zero', () => {
    // 0.1s into a lap with 0.16s of audio still in flight, the listener is
    // hearing the previous lap's tail — not a frozen downbeat.
    expect(heardLoopTimeSec(0.1, 8, 20, 0.16)).toBeCloseTo(7.94)
  })

  it('clamps to zero before the first sound arrives', () => {
    expect(heardLoopTimeSec(0.1, 8, 0.1, 0.16)).toBe(0)
  })
})

describe('heardLoopProgress', () => {
  it('maps scheduled progress to heard progress', () => {
    expect(heardLoopProgress(0.5, 8, 20, 0.16)).toBeCloseTo(0.48)
  })

  it('wraps across the loop seam', () => {
    expect(heardLoopProgress(0, 8, 20, 0.16)).toBeCloseTo(0.98)
  })

  it('returns zero for non-positive duration', () => {
    expect(heardLoopProgress(0.5, 0, 20, 0.16)).toBe(0)
  })
})
