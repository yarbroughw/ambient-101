import { describe, expect, it } from 'vitest'
import { normalizeMeterLevel } from './meterLevel'

describe('normalizeMeterLevel', () => {
  it('returns 0 for non-positive or non-finite input', () => {
    expect(normalizeMeterLevel(0)).toBe(0)
    expect(normalizeMeterLevel(-1)).toBe(0)
    expect(normalizeMeterLevel(Number.NaN)).toBe(0)
  })

  it('maps typical RMS values into 0–1 range', () => {
    expect(normalizeMeterLevel(0.06)).toBeCloseTo(1, 5)
    expect(normalizeMeterLevel(0.03)).toBeGreaterThan(0)
    expect(normalizeMeterLevel(0.03)).toBeLessThan(1)
  })

  it('caps output at 1', () => {
    expect(normalizeMeterLevel(1)).toBe(1)
  })
})
