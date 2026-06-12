import type { TimelineMotion } from './motionSettings'

export const ZOOM_STEP_BASE = Math.SQRT2

export function zoomFactor(zoomStop: number): number {
  return ZOOM_STEP_BASE ** zoomStop
}

export function medianPeriod(periods: number[]): number {
  if (periods.length === 0) {
    return 1
  }
  const sorted = [...periods].sort((a, b) => a - b)
  return sorted[(sorted.length - 1) >> 1]
}

export function visibleCycles(windowSec: number, median: number): number {
  return windowSec / (median || 1)
}

export function laneTileWidth(opts: {
  period: number
  pxPerSec: number
  laneWidth: number
  visibleCycles: number
  motion: TimelineMotion
  zoomStop: number
}): number {
  const zoom = zoomFactor(opts.zoomStop)
  const base =
    opts.motion === 'fixed-width'
      ? opts.laneWidth / opts.visibleCycles
      : opts.period * opts.pxPerSec
  return base * zoom
}

export function laneMelodyWidth(opts: {
  melodyWindow: number
  period: number
  tileWidth: number
}): number {
  const fillFrac = Math.min(opts.melodyWindow, opts.period) / opts.period
  return fillFrac * opts.tileWidth
}

export function laneCrossTimeSec(opts: {
  period: number
  tileWidth: number
  laneWidth: number
}): number {
  if (opts.tileWidth <= 0 || opts.laneWidth <= 0) {
    return 0
  }
  return opts.laneWidth / (opts.tileWidth / opts.period)
}
