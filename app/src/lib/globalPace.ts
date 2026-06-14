import type { LoopPattern } from '../audio/patternTypes'
import {
  LOOP_COLS_MAX,
  MELODY_BPM_MAX,
  bpmForFill,
  melodyFill,
  minBpmForLoopDuration,
  minLoopDurationForBpm,
} from './gridLayout'

/** Pace stored as integer hundredths (100 = 1×) on a 0.10 grid. */
export const PACE_STEP_HUNDREDTHS = 10
export const PACE_MIN_HUNDREDTHS = 50
export const PACE_MAX_HUNDREDTHS = 200
export const DEFAULT_PACE_HUNDREDTHS = 100
export const PACE_MIN = PACE_MIN_HUNDREDTHS / 100
export const PACE_MAX = PACE_MAX_HUNDREDTHS / 100
export const DEFAULT_PACE_SCALE = DEFAULT_PACE_HUNDREDTHS / 100
export const PACE_STEP = PACE_STEP_HUNDREDTHS / 100
export const LOOP_DURATION_MAX = 60
export const LOOP_DURATION_MAX_MS = LOOP_DURATION_MAX * 1000
/** Typed readout granularity in display (playback) seconds. */
export const LOOP_DURATION_STEP = 0.01
/** Drag/wheel granularity in display (playback) seconds. */
export const LOOP_DURATION_DRAG_STEP = 0.1

export type PaceOptions = {
  paceScale: number
  lockMelodyTempo: boolean
}

export type PlaybackTiming = {
  loopDurationSec: number
  bpm: number
}

export function paceFromHundredths(hundredths: number): number {
  return hundredths / 100
}

export function normalizePaceHundredths(hundredths: number): number {
  const clamped = Math.min(
    PACE_MAX_HUNDREDTHS,
    Math.max(PACE_MIN_HUNDREDTHS, hundredths),
  )
  const offset = clamped - PACE_MIN_HUNDREDTHS
  const steps = Math.round(offset / PACE_STEP_HUNDREDTHS)
  return PACE_MIN_HUNDREDTHS + steps * PACE_STEP_HUNDREDTHS
}

export function paceToHundredths(scale: number): number {
  return normalizePaceHundredths(Math.round(scale * 100))
}

export function clampPaceScale(scale: number): number {
  return paceFromHundredths(paceToHundredths(scale))
}

export function formatPaceScale(scale: number): string {
  const hundredths = paceToHundredths(scale)
  if (hundredths === DEFAULT_PACE_HUNDREDTHS) {
    return '1×'
  }
  const value = hundredths / 100
  return `${value.toFixed(1).replace(/\.0$/, '')}×`
}

export function storedLoopDurationSec(loopDurationMs: number): number {
  return loopDurationMs / 1000
}

/** Single-round-trip store: display seconds × pace → integer ms. */
export function loopDurationMsFromDisplay(
  displaySeconds: number,
  paceHundredths: number,
): number {
  return Math.round(displaySeconds * paceHundredths * 10)
}

/** Playback seconds derived from stored ms and pace (never fed back into the model). */
export function playbackLoopDurationSec(
  loopDurationMs: number,
  paceHundredths: number,
): number {
  return loopDurationMs / (paceHundredths * 10)
}

function playbackLoopDurationMs(
  loopDurationMs: number,
  paceHundredths: number,
): number {
  return Math.round((loopDurationMs * 100) / paceHundredths)
}

/** Display-only snap for dial drag/wheel; never use on the store path. */
export function snapDisplayLoopDuration(
  seconds: number,
  step: number = LOOP_DURATION_DRAG_STEP,
): number {
  const precision = Math.max(0, -Math.floor(Math.log10(step)))
  const scale = 10 ** precision
  const snapped =
    (Math.round((seconds * scale) / (step * scale)) * (step * scale)) / scale
  return Number(snapped.toFixed(precision))
}

export function formatDisplayLoopDuration(seconds: number): string {
  return seconds.toFixed(2)
}

export function formatDisplayBpm(bpm: number): number {
  return Math.round(bpm)
}

export function composedBpmFromDisplay(
  displayBpm: number,
  options: PaceOptions,
): number {
  if (options.lockMelodyTempo) {
    return Math.round(displayBpm)
  }

  const paceHundredths = paceToHundredths(options.paceScale)
  return Math.round((Math.round(displayBpm) * 100) / paceHundredths)
}

/** Default 2s tape minimum; a shortened loop window may go below it. */
const DEFAULT_LOOP_DURATION_FLOOR = 2

function playbackLoopDurationFloor(
  bpm: number,
  lockMelodyTempo: boolean,
  loopCols: number,
): number {
  const windowFloor = minLoopDurationForBpm(bpm, loopCols)
  // A deliberately shortened loop (fewer than the full grid columns) follows
  // its window even below the 2s tape minimum, so short cells loop seamlessly.
  if (loopCols < LOOP_COLS_MAX) {
    return windowFloor
  }
  if (!lockMelodyTempo) {
    return Math.max(DEFAULT_LOOP_DURATION_FLOOR, windowFloor)
  }
  return DEFAULT_LOOP_DURATION_FLOOR
}

function clampEffectiveLoopDuration(
  loopDurationSec: number,
  bpm: number,
  lockMelodyTempo: boolean,
  loopCols: number,
): number {
  const floor = playbackLoopDurationFloor(bpm, lockMelodyTempo, loopCols)
  return Math.min(LOOP_DURATION_MAX, Math.max(floor, loopDurationSec))
}

function clampEffectiveBpm(
  bpm: number,
  loopDurationSec: number,
  loopCols: number,
): number {
  // Keep bpm a float: rounding here would reintroduce a melody/period
  // mismatch and break exact seamless (100% fill) playback under pace.
  return Math.min(
    MELODY_BPM_MAX,
    Math.max(minBpmForLoopDuration(loopDurationSec, loopCols), bpm),
  )
}

export function applyPlaybackTiming(
  pattern: LoopPattern,
  options: PaceOptions,
): PlaybackTiming {
  const paceHundredths = paceToHundredths(options.paceScale)
  const paceScale = paceHundredths / 100
  const loopCols = pattern.loopCols
  let loopDurationSec = playbackLoopDurationSec(
    pattern.loopDurationMs,
    paceHundredths,
  )
  let bpm = options.lockMelodyTempo ? pattern.bpm : pattern.bpm * paceScale

  loopDurationSec = clampEffectiveLoopDuration(
    loopDurationSec,
    bpm,
    options.lockMelodyTempo,
    loopCols,
  )
  if (!options.lockMelodyTempo) {
    bpm = clampEffectiveBpm(bpm, loopDurationSec, loopCols)
    loopDurationSec = clampEffectiveLoopDuration(
      loopDurationSec,
      bpm,
      options.lockMelodyTempo,
      loopCols,
    )
  }

  return {
    loopDurationSec,
    bpm,
  }
}

export function adaptPatternForLockMelodyTempoChange(
  pattern: LoopPattern,
  options: PaceOptions,
  previousLockMelodyTempo: boolean,
): LoopPattern {
  if (previousLockMelodyTempo === options.lockMelodyTempo) {
    return pattern
  }

  const timing = applyPlaybackTiming(pattern, {
    paceScale: options.paceScale,
    lockMelodyTempo: previousLockMelodyTempo,
  })

  if (options.lockMelodyTempo) {
    return { ...pattern, bpm: timing.bpm }
  }

  const fill = melodyFill(
    timing.loopDurationSec,
    timing.bpm,
    pattern.loopCols,
  )
  const storedSec = storedLoopDurationSec(pattern.loopDurationMs)
  return {
    ...pattern,
    bpm: bpmForFill(storedSec, fill, pattern.loopCols),
  }
}

function timingMatchesScale(
  pattern: LoopPattern,
  paceScale: number,
  lockMelodyTempo: boolean,
): boolean {
  const paceHundredths = paceToHundredths(paceScale)
  const effective = applyPlaybackTiming(pattern, { paceScale, lockMelodyTempo })
  const targetPlaybackMs = playbackLoopDurationMs(
    pattern.loopDurationMs,
    paceHundredths,
  )
  const effectivePlaybackMs = Math.round(effective.loopDurationSec * 1000)

  if (effectivePlaybackMs !== targetPlaybackMs) {
    return false
  }

  if (lockMelodyTempo) {
    const fill = melodyFill(
      effective.loopDurationSec,
      effective.bpm,
      pattern.loopCols,
    )
    if (fill > 1 + 1e-9) {
      return false
    }
    return true
  }

  const targetBpm = pattern.bpm * (paceHundredths / 100)
  if (Math.abs(effective.bpm - targetBpm) > 0.5) {
    return false
  }

  return true
}

export function canStepPaceHundredths(
  patterns: LoopPattern[],
  currentHundredths: number,
  direction: 'up' | 'down',
  lockMelodyTempo: boolean,
): boolean {
  if (patterns.length === 0) {
    return false
  }

  const nextHundredths = stepPaceHundredths(currentHundredths, direction)
  if (nextHundredths === currentHundredths) {
    return false
  }

  const nextScale = paceFromHundredths(nextHundredths)
  return patterns.every((pattern) =>
    timingMatchesScale(pattern, nextScale, lockMelodyTempo),
  )
}

export function canStepPaceScale(
  patterns: LoopPattern[],
  currentScale: number,
  direction: 'up' | 'down',
  lockMelodyTempo: boolean,
): boolean {
  return canStepPaceHundredths(
    patterns,
    paceToHundredths(currentScale),
    direction,
    lockMelodyTempo,
  )
}

export function stepPaceHundredths(
  currentHundredths: number,
  direction: 'up' | 'down',
): number {
  const normalized = normalizePaceHundredths(currentHundredths)
  const next =
    direction === 'up'
      ? normalized + PACE_STEP_HUNDREDTHS
      : normalized - PACE_STEP_HUNDREDTHS

  return Math.min(PACE_MAX_HUNDREDTHS, Math.max(PACE_MIN_HUNDREDTHS, next))
}

export function stepPaceScale(
  currentScale: number,
  direction: 'up' | 'down',
): number {
  return paceFromHundredths(stepPaceHundredths(paceToHundredths(currentScale), direction))
}

export function syncLoopPlayback(
  entry: {
    loop: { setDuration: (duration: number) => void }
    rebindPattern: (pattern: LoopPattern) => void
  },
  composed: LoopPattern,
  options: PaceOptions,
): void {
  const timing = applyPlaybackTiming(composed, options)
  entry.loop.setDuration(timing.loopDurationSec)
  entry.rebindPattern({ ...composed, bpm: timing.bpm })
}
