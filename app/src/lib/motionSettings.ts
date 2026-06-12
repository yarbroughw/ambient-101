export type TimelineMotion = 'fixed-rate' | 'fixed-width'

const MOTION_KEY = 'ambient-101:timeline-motion'
const ZOOM_KEY = 'ambient-101:timeline-zoom-stop'

export const MIN_ZOOM_STOP = -2
export const MAX_ZOOM_STOP = 2
export const DEFAULT_ZOOM_STOP = 0

export function loadTimelineMotion(): TimelineMotion {
  try {
    const stored = localStorage.getItem(MOTION_KEY)
    if (stored === 'fixed-rate' || stored === 'fixed-width') {
      return stored
    }
  } catch {
    // ignore quota / privacy mode
  }

  return 'fixed-rate'
}

export function saveTimelineMotion(value: TimelineMotion): void {
  try {
    localStorage.setItem(MOTION_KEY, value)
  } catch {
    // ignore quota / privacy mode
  }
}

export function clampZoomStop(stop: number): number {
  return Math.min(MAX_ZOOM_STOP, Math.max(MIN_ZOOM_STOP, Math.round(stop)))
}

export function loadTimelineZoomStop(): number {
  try {
    const stored = localStorage.getItem(ZOOM_KEY)
    if (stored != null) {
      const parsed = Number.parseInt(stored, 10)
      if (Number.isFinite(parsed)) {
        return clampZoomStop(parsed)
      }
    }
  } catch {
    // ignore quota / privacy mode
  }

  return DEFAULT_ZOOM_STOP
}

export function saveTimelineZoomStop(value: number): void {
  try {
    localStorage.setItem(ZOOM_KEY, String(clampZoomStop(value)))
  } catch {
    // ignore quota / privacy mode
  }
}

export function stepTimelineZoomStop(
  current: number,
  direction: 'up' | 'down',
): number {
  return clampZoomStop(current + (direction === 'up' ? 1 : -1))
}
