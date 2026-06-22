import { describe, expect, it } from 'vitest'
import {
  controlRatioToValue,
  controlStepRatio,
  valueToControlRatio,
} from './controlScale'

describe('controlScale', () => {
  const min = 20
  const max = 12000

  it('maps linear endpoints', () => {
    expect(valueToControlRatio(20, min, max, 'linear')).toBe(0)
    expect(valueToControlRatio(12000, min, max, 'linear')).toBe(1)
    expect(controlRatioToValue(0, min, max, 'linear')).toBe(20)
    expect(controlRatioToValue(1, min, max, 'linear')).toBe(12000)
  })

  it('maps log endpoints and geometric midpoint', () => {
    const mid = Math.sqrt(min * max)
    expect(valueToControlRatio(20, min, max, 'log')).toBeCloseTo(0)
    expect(valueToControlRatio(12000, min, max, 'log')).toBeCloseTo(1)
    expect(valueToControlRatio(mid, min, max, 'log')).toBeCloseTo(0.5)
    expect(controlRatioToValue(0.5, min, max, 'log')).toBeCloseTo(mid)
  })

  it('uses larger ratio steps at low frequencies for log controls', () => {
    const lowStep = controlStepRatio(100, 20, min, max, 'log')
    const highStep = controlStepRatio(4000, 20, min, max, 'log')
    expect(lowStep).toBeGreaterThan(highStep)
  })
})
