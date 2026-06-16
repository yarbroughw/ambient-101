import { useEffect } from 'react'
import type { DemoLoop } from '../audio/demoPatterns'
import type { TimelineMotion } from '../lib/motionSettings'
import { EnsembleTimeline } from './EnsembleTimeline'
import { TimelineFullscreenButton } from './TimelineFullscreenButton'
import { TimelineMotionControls } from './TimelineMotionControls'
import './TimelineFullscreenOverlay.css'

type TimelineFullscreenOverlayProps = {
  loops: DemoLoop[]
  runningById: Record<string, boolean>
  motion: TimelineMotion
  zoomStop: number
  onMotionChange: (motion: TimelineMotion) => void
  onZoomStopChange: (zoomStop: number) => void
  onSelectLane?: (id: string) => void
  onClose: () => void
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return (
    target.closest('input, textarea, select, [contenteditable="true"]') != null
  )
}

export function TimelineFullscreenOverlay({
  loops,
  runningById,
  motion,
  zoomStop,
  onMotionChange,
  onZoomStopChange,
  onSelectLane,
  onClose,
}: TimelineFullscreenOverlayProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.repeat) {
        return
      }
      if (isTypingTarget(event.target)) {
        return
      }
      event.preventDefault()
      onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="timeline-fullscreen"
      role="dialog"
      aria-modal="true"
      aria-label="Fullscreen timeline"
    >
      <div className="timeline-fullscreen__float">
        <TimelineMotionControls
          motion={motion}
          zoomStop={zoomStop}
          onMotionChange={onMotionChange}
          onZoomStopChange={onZoomStopChange}
        />
        <TimelineFullscreenButton active onClick={onClose} />
      </div>
      <EnsembleTimeline
        layout="fullscreen"
        loops={loops}
        runningById={runningById}
        motion={motion}
        zoomStop={zoomStop}
        onSelectLane={onSelectLane}
      />
    </div>
  )
}
