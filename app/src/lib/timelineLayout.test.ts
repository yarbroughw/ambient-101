import { describe, expect, it } from 'vitest'
import {
  laneCrossTimeSec,
  laneTileWidth,
  medianPeriod,
  visibleCycles,
  zoomFactor,
} from './timelineLayout'

describe('timelineLayout', () => {
  it('maps zoom stops through sqrt(2) steps', () => {
    expect(zoomFactor(0)).toBeCloseTo(1)
    expect(zoomFactor(1)).toBeCloseTo(Math.SQRT2)
    expect(zoomFactor(-1)).toBeCloseTo(1 / Math.SQRT2)
    expect(zoomFactor(2)).toBeCloseTo(2)
  })

  it('uses the median period for visible cycle anchoring', () => {
    expect(medianPeriod([6.5, 9, 11])).toBe(9)
    expect(visibleCycles(26.4, 9)).toBeCloseTo(2.933, 2)
  })

  it('keeps the median reel unchanged when switching motion at zoom 0', () => {
    const laneWidth = 440
    const windowSec = 26.4
    const pxPerSec = laneWidth / windowSec
    const periods = [6.5, 9, 11]
    const median = medianPeriod(periods)
    const cycles = visibleCycles(windowSec, median)

    const fixedRate = laneTileWidth({
      period: median,
      pxPerSec,
      laneWidth,
      visibleCycles: cycles,
      motion: 'fixed-rate',
      zoomStop: 0,
    })
    const fixedWidth = laneTileWidth({
      period: median,
      pxPerSec,
      laneWidth,
      visibleCycles: cycles,
      motion: 'fixed-width',
      zoomStop: 0,
    })

    expect(fixedWidth).toBeCloseTo(fixedRate)
  })

  it('makes cross-time equal to N periods in fixed-width mode', () => {
    const laneWidth = 440
    const windowSec = 26.4
    const pxPerSec = laneWidth / windowSec
    const periods = [6.5, 9, 11]
    const cycles = visibleCycles(windowSec, medianPeriod(periods))

    for (const period of periods) {
      const tileWidth = laneTileWidth({
        period,
        pxPerSec,
        laneWidth,
        visibleCycles: cycles,
        motion: 'fixed-width',
        zoomStop: 0,
      })
      expect(laneCrossTimeSec({ period, tileWidth, laneWidth })).toBeCloseTo(
        cycles * period,
      )
    }
  })
})
