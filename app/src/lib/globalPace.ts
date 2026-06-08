import type { LoopPattern } from '../audio/patternTypes'
import {
  MELODY_BPM_MAX,
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

export type PaceOptions = {
  paceScale: number
  paceAffectsMelody: boolean
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

export function formatDisplayLoopDuration(seconds: number): string {
  const rounded = Math.round(seconds * 10) / 10
  return rounded.toFixed(1)
}

export function formatDisplayBpm(bpm: number): number {
  return Math.round(bpm)
}

export function composedLoopDurationFromDisplay(
  displaySeconds: number,
  paceScale: number,
): number {
  const displayTenth = Math.round(displaySeconds * 10) / 10
  return displayTenth * clampPaceScale(paceScale)
}

export function composedBpmFromDisplay(
  displayBpm: number,
  options: PaceOptions,
): number {
  if (!options.paceAffectsMelody) {
    return Math.round(displayBpm)
  }

  return Math.round(Math.round(displayBpm) / clampPaceScale(options.paceScale))
}

function playbackLoopDurationFloor(bpm: number, paceAffectsMelody: boolean): number {
  if (paceAffectsMelody) {
    return Math.max(2, minLoopDurationForBpm(bpm))
  }
  return 2
}

function clampEffectiveLoopDuration(
  loopDuration: number,
  bpm: number,
  paceAffectsMelody: boolean,
): number {
  const floor = playbackLoopDurationFloor(bpm, paceAffectsMelody)
  return Math.min(LOOP_DURATION_MAX, Math.max(floor, loopDuration))
}

function clampEffectiveBpm(bpm: number, loopDuration: number): number {
  return Math.min(
    MELODY_BPM_MAX,
    Math.max(minBpmForLoopDuration(loopDuration), Math.round(bpm)),
  )
}

export function applyPlaybackTiming(
  pattern: LoopPattern,
  options: PaceOptions,
): LoopPattern {
  const paceScale = clampPaceScale(options.paceScale)
  let loopDuration = pattern.loopDuration / paceScale
  let bpm = options.paceAffectsMelody ? pattern.bpm * paceScale : pattern.bpm

  loopDuration = clampEffectiveLoopDuration(
    loopDuration,
    bpm,
    options.paceAffectsMelody,
  )
  if (options.paceAffectsMelody) {
    bpm = clampEffectiveBpm(bpm, loopDuration)
    loopDuration = clampEffectiveLoopDuration(
      loopDuration,
      bpm,
      options.paceAffectsMelody,
    )
  }

  return {
    ...pattern,
    loopDuration,
    bpm,
  }
}

function rawEffectiveLoopDuration(pattern: LoopPattern, paceScale: number): number {
  return pattern.loopDuration / paceScale
}

function rawEffectiveBpm(
  pattern: LoopPattern,
  paceScale: number,
  paceAffectsMelody: boolean,
): number {
  return paceAffectsMelody ? pattern.bpm * paceScale : pattern.bpm
}

function timingMatchesScale(
  pattern: LoopPattern,
  paceScale: number,
  paceAffectsMelody: boolean,
): boolean {
  const effective = applyPlaybackTiming(pattern, { paceScale, paceAffectsMelody })
  const targetDuration = rawEffectiveLoopDuration(pattern, paceScale)
  const targetBpm = rawEffectiveBpm(pattern, paceScale, paceAffectsMelody)

  if (Math.abs(effective.loopDuration - targetDuration) > 0.01) {
    return false
  }

  if (paceAffectsMelody && Math.abs(effective.bpm - targetBpm) > 0.5) {
    return false
  }

  return true
}

export function canStepPaceHundredths(
  patterns: LoopPattern[],
  currentHundredths: number,
  direction: 'up' | 'down',
  paceAffectsMelody: boolean,
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
    timingMatchesScale(pattern, nextScale, paceAffectsMelody),
  )
}

export function canStepPaceScale(
  patterns: LoopPattern[],
  currentScale: number,
  direction: 'up' | 'down',
  paceAffectsMelody: boolean,
): boolean {
  return canStepPaceHundredths(
    patterns,
    paceToHundredths(currentScale),
    direction,
    paceAffectsMelody,
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
  const effective = applyPlaybackTiming(composed, options)
  entry.loop.setDuration(effective.loopDuration)
  entry.rebindPattern(effective)
}
