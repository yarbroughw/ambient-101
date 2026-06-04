import type { CSSProperties } from 'react'

const OUTLINE_RGB = [150, 150, 150] as const
const ACTIVE_RGB = [112, 92, 252] as const

function mixRgb(
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  t: number,
): string {
  const clamped = Math.min(1, Math.max(0, t))
  const r = Math.round(from[0] + (to[0] - from[0]) * clamped)
  const g = Math.round(from[1] + (to[1] - from[1]) * clamped)
  const b = Math.round(from[2] + (to[2] - from[2]) * clamped)
  return `rgb(${r}, ${g}, ${b})`
}

export function ringStyleFromLevel(level: number): CSSProperties {
  const t = Math.min(1, Math.max(0, level))
  return {
    borderColor: mixRgb(OUTLINE_RGB, ACTIVE_RGB, t),
    opacity: 0.5 + t * 0.5,
    boxShadow: `0 0 ${2 + t * 14}px rgba(112, 92, 252, ${0.12 + t * 0.7})`,
  }
}

export function dotHeadStyle(dotFlash: number): CSSProperties {
  const t = Math.min(1, Math.max(0, dotFlash))
  return {
    background: mixRgb(ACTIVE_RGB, [255, 255, 255], t),
    boxShadow:
      t > 0.08
        ? `0 0 ${4 + t * 10}px rgba(255, 255, 255, ${0.35 + t * 0.55})`
        : 'none',
  }
}

/** Tone Meter normalRange returns raw waveform RMS, not always 0–1. */
export function normalizeMeterLevel(raw: number): number {
  const boosted = raw * 5
  return Math.min(1, Math.max(0, boosted))
}
