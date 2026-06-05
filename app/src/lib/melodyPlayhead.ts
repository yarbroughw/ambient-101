import type { MelodyBounds } from '../audio/patternTypes'

export function melodyPlayheadRatio(
  loopTimeSec: number,
  bounds: MelodyBounds,
): number | null {
  if (bounds.span <= 0) {
    return null
  }

  if (loopTimeSec < bounds.start) {
    return 0
  }

  if (loopTimeSec >= bounds.end) {
    return null
  }

  return (loopTimeSec - bounds.start) / bounds.span
}
