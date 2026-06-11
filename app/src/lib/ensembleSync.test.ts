import { describe, expect, it } from 'vitest'
import {
  ensembleCycleMs,
  formatSyncDuration,
  lcmMs,
  nextSyncTimeMs,
  timeUntilEnsembleSyncMs,
} from './ensembleSync'

describe('lcmMs', () => {
  it('returns the least common multiple of loop periods', () => {
    expect(lcmMs([10_000, 7_000])).toBe(70_000)
    expect(lcmMs([10_000, 10_000])).toBe(10_000)
  })
})

describe('nextSyncTimeMs', () => {
  it('returns the next downbeat for a single reel', () => {
    expect(nextSyncTimeMs([0], [10_000], 5_000)).toBe(10_000)
    expect(nextSyncTimeMs([2_000], [10_000], 5_000)).toBe(12_000)
  })

  it('finds the next shared downbeat of reels started together', () => {
    expect(nextSyncTimeMs([0, 0], [10_000, 7_000], 0)).toBe(0)
    expect(nextSyncTimeMs([0, 0], [10_000, 7_000], 1)).toBe(70_000)
    expect(nextSyncTimeMs([5_000, 5_000], [10_000, 7_000], 6_000)).toBe(75_000)
  })

  it('solves staggered starts when alignment is reachable', () => {
    // Second reel started 3s late: downbeats coincide at 10s, 80s, ...
    expect(nextSyncTimeMs([0, 3_000], [10_000, 7_000], 0)).toBe(10_000)
    expect(nextSyncTimeMs([0, 3_000], [10_000, 7_000], 11_000)).toBe(80_000)
  })

  it('absorbs sub-grid start offsets from near-simultaneous starts', () => {
    // "play all" starts reels microseconds apart; a 1ms rounding difference
    // must not derail the countdown.
    expect(nextSyncTimeMs([0, 1], [1_500, 1_510], 1)).toBe(226_500)
  })

  it('counts to the closest approach when exact alignment is unreachable', () => {
    // 1.5s and 1.51s reels offset by 705ms never coincide exactly; the
    // nearest miss (5ms) is at 120s.
    expect(nextSyncTimeMs([0, 705], [1_500, 1_510], 0)).toBe(120_000)
  })

  it('repeats every full cycle', () => {
    expect(nextSyncTimeMs([0, 0], [1_500, 1_510], 230_000)).toBe(453_000)
  })
})

describe('ensembleCycleMs', () => {
  it('equals the playback lcm at 1× pace', () => {
    const periods = [
      { composedMs: 1_500, playbackMs: 1_500 },
      { composedMs: 1_510, playbackMs: 1_510 },
    ]
    expect(ensembleCycleMs(periods)).toBe(226_500)
  })

  it('stretches the composed cycle instead of compounding rounded periods', () => {
    // At 0.9× the stretched periods round to 1667/1678ms whose gcd collapses
    // to 1ms; the cycle must stay the composed lcm stretched once (~4m 12s),
    // not lcm(1667, 1678) ≈ 46m 37s.
    const periods = [
      { composedMs: 1_500, playbackMs: 1_667 },
      { composedMs: 1_510, playbackMs: 1_678 },
    ]
    const cycle = ensembleCycleMs(periods)
    expect(cycle).toBeGreaterThan(251_000)
    expect(cycle).toBeLessThan(252_500)
  })
})

describe('timeUntilEnsembleSyncMs', () => {
  it('counts a full stretched cycle for reels started together under pace', () => {
    const periods = [
      { composedMs: 1_500, playbackMs: 1_667 },
      { composedMs: 1_510, playbackMs: 1_678 },
    ]
    const startsMs = [10_000, 10_000]
    const remaining = timeUntilEnsembleSyncMs(periods, startsMs, 10_050)
    const cycle = ensembleCycleMs(periods)
    expect(remaining).toBeGreaterThan(cycle - 100)
    expect(remaining).toBeLessThanOrEqual(cycle)
  })
})

describe('formatSyncDuration', () => {
  it('formats short and long durations', () => {
    expect(formatSyncDuration(8.4)).toBe('8.4s')
    expect(formatSyncDuration(42)).toBe('42s')
    expect(formatSyncDuration(125)).toBe('2m 5s')
    expect(formatSyncDuration(120)).toBe('2m')
  })

  it('formats hours and days with one minor unit', () => {
    expect(formatSyncDuration(3_600)).toBe('1h')
    expect(formatSyncDuration(12_120)).toBe('3h 22m')
    expect(formatSyncDuration(86_400)).toBe('1d')
    expect(formatSyncDuration(604_800)).toBe('1w')
    expect(formatSyncDuration(2_255_040)).toBe('3w 5d')
  })

  it('formats weeks, months, and years with one minor unit', () => {
    expect(formatSyncDuration(1_209_600)).toBe('2w')
    expect(formatSyncDuration(2_592_000)).toBe('1mo')
    expect(formatSyncDuration(31_536_000)).toBe('1y')
    expect(formatSyncDuration(35_000_000)).toBe('1y 1mo')
    expect(formatSyncDuration(36_720_000)).toBe('1y 2mo')
  })

  it('carries when the minor unit rounds up to a whole major unit', () => {
    expect(formatSyncDuration(119.6)).toBe('2m')
    expect(formatSyncDuration(3_599.7)).toBe('1h')
    expect(formatSyncDuration(86_399)).toBe('1d')
  })
})
