const STORAGE_KEY = 'ambient-101:visual-latency-offset-ms'

export const VISUAL_LATENCY_OFFSET_MS_MIN = -100
export const VISUAL_LATENCY_OFFSET_MS_MAX = 500
export const VISUAL_LATENCY_OFFSET_MS_STEP = 10

function clampVisualLatencyOffsetMs(ms: number): number {
  if (!Number.isFinite(ms)) {
    return 0
  }
  return Math.min(
    VISUAL_LATENCY_OFFSET_MS_MAX,
    Math.max(VISUAL_LATENCY_OFFSET_MS_MIN, Math.round(ms)),
  )
}

export function loadVisualLatencyOffsetMs(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      return clampVisualLatencyOffsetMs(Number(stored))
    }
  } catch {
    // ignore quota / privacy mode
  }

  return 0
}

let cachedOffsetMs = loadVisualLatencyOffsetMs()

export function getVisualLatencyOffsetMs(): number {
  return cachedOffsetMs
}

export function getVisualLatencyOffsetSec(): number {
  return cachedOffsetMs / 1000
}

export function saveVisualLatencyOffsetMs(ms: number): void {
  cachedOffsetMs = clampVisualLatencyOffsetMs(ms)
  try {
    localStorage.setItem(STORAGE_KEY, String(cachedOffsetMs))
  } catch {
    // ignore quota / privacy mode
  }
}

export function formatVisualLatencyOffsetMs(ms: number): string {
  if (ms === 0) {
    return '0 ms'
  }
  return ms > 0 ? `+${ms} ms` : `${ms} ms`
}
