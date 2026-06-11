import * as Tone from 'tone'
import { getVisualLatencyOffsetSec } from '../lib/visualLatencySettings'

/** Seconds from the graph output to the listener's ears (device-specific). */
export function getOutputLatencySec(): number {
  const ctx = Tone.getContext().rawContext as AudioContext & {
    baseLatency?: number
    outputLatency?: number
  }
  return (ctx.baseLatency ?? 0) + (ctx.outputLatency ?? 0)
}

/** Device latency plus the user offset from settings. */
export function getTotalVisualLatencySec(): number {
  return getOutputLatencySec() + getVisualLatencyOffsetSec()
}

/**
 * Position of the listener's ears on the scheduling timeline — what is
 * being heard right now was scheduled latencySec ago.
 */
export function heardNowSec(): number {
  return Tone.now() - getTotalVisualLatencySec()
}

export function heardTimeSec(
  scheduledTimeSec: number,
  latencySec = getTotalVisualLatencySec(),
): number {
  return Math.max(0, scheduledTimeSec - latencySec)
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

/**
 * Loop-relative time (sec) at the listener's ears. Wraps across the loop
 * seam — at the start of each lap the previous lap's tail is still in
 * flight, so clamping there would stall the heard position at 0 for
 * latencySec every lap. Clamps only before the first sound has arrived.
 */
export function heardLoopTimeSec(
  scheduledLoopTimeSec: number,
  durationSec: number,
  elapsedSinceStartSec: number,
  latencySec = getTotalVisualLatencySec(),
): number {
  if (durationSec <= 0 || elapsedSinceStartSec < latencySec) {
    return 0
  }
  return mod(scheduledLoopTimeSec - latencySec, durationSec)
}

export function heardLoopProgress(
  scheduledProgress: number,
  durationSec: number,
  elapsedSinceStartSec: number,
  latencySec = getTotalVisualLatencySec(),
): number {
  if (durationSec <= 0) {
    return 0
  }
  return (
    heardLoopTimeSec(
      scheduledProgress * durationSec,
      durationSec,
      elapsedSinceStartSec,
      latencySec,
    ) / durationSec
  )
}
