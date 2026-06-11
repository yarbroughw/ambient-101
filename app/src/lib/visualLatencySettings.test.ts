import { afterEach, describe, expect, it } from 'vitest'
import {
  formatVisualLatencyOffsetMs,
  getVisualLatencyOffsetMs,
  loadVisualLatencyOffsetMs,
  saveVisualLatencyOffsetMs,
  VISUAL_LATENCY_OFFSET_MS_MAX,
  VISUAL_LATENCY_OFFSET_MS_MIN,
} from './visualLatencySettings'

const STORAGE_KEY = 'ambient-101:visual-latency-offset-ms'

describe('visualLatencySettings', () => {
  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY)
    saveVisualLatencyOffsetMs(0)
  })

  it('defaults to zero', () => {
    expect(loadVisualLatencyOffsetMs()).toBe(0)
  })

  it('persists and updates the in-memory cache', () => {
    saveVisualLatencyOffsetMs(120)
    expect(getVisualLatencyOffsetMs()).toBe(120)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('120')
    expect(loadVisualLatencyOffsetMs()).toBe(120)
  })

  it('clamps to configured bounds', () => {
    saveVisualLatencyOffsetMs(999)
    expect(getVisualLatencyOffsetMs()).toBe(VISUAL_LATENCY_OFFSET_MS_MAX)
    saveVisualLatencyOffsetMs(-999)
    expect(getVisualLatencyOffsetMs()).toBe(VISUAL_LATENCY_OFFSET_MS_MIN)
  })

  it('formats signed offsets for display', () => {
    expect(formatVisualLatencyOffsetMs(0)).toBe('0 ms')
    expect(formatVisualLatencyOffsetMs(80)).toBe('+80 ms')
    expect(formatVisualLatencyOffsetMs(-40)).toBe('-40 ms')
  })
})
