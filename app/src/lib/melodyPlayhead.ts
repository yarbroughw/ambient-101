import type { MelodyBounds } from '../audio/patternTypes'

export function melodyPlayheadRatio(
  loopTimeSec: number,
  bounds: MelodyBounds,
): number {
  if (bounds.span <= 0) {
    return 0
  }

  if (loopTimeSec < bounds.start) {
    return 0
  }

  if (loopTimeSec >= bounds.end) {
    return 1
  }

  return (loopTimeSec - bounds.start) / bounds.span
}
