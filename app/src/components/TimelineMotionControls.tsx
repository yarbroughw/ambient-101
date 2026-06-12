import {
  MAX_ZOOM_STOP,
  MIN_ZOOM_STOP,
  stepTimelineZoomStop,
  type TimelineMotion,
} from '../lib/motionSettings'
import { zoomFactor } from '../lib/timelineLayout'
import './TimelineMotionControls.css'

type TimelineMotionControlsProps = {
  motion: TimelineMotion
  zoomStop: number
  onMotionChange: (motion: TimelineMotion) => void
  onZoomStopChange: (zoomStop: number) => void
}

function formatZoomReadout(zoomStop: number): string {
  const factor = zoomFactor(zoomStop)
  if (Math.abs(factor - 1) < 0.01) {
    return '1×'
  }
  if (factor >= 10) {
    return `${factor.toFixed(0)}×`
  }
  return `${factor.toFixed(1)}×`
}

export function TimelineMotionControls({
  motion,
  zoomStop,
  onMotionChange,
  onZoomStopChange,
}: TimelineMotionControlsProps) {
  const canZoomOut = zoomStop > MIN_ZOOM_STOP
  const canZoomIn = zoomStop < MAX_ZOOM_STOP

  return (
    <div className="timeline-motion-controls" aria-label="Timeline motion">
      <div className="timeline-motion-controls__motion" role="group" aria-label="Scroll mode">
        <button
          type="button"
          className={`timeline-motion-controls__mode${
            motion === 'fixed-rate' ? ' is-active' : ''
          }`}
          aria-pressed={motion === 'fixed-rate'}
          title="fixed scroll rate — tile width shows loop length"
          onClick={() => onMotionChange('fixed-rate')}
        >
          rate
        </button>
        <button
          type="button"
          className={`timeline-motion-controls__mode${
            motion === 'fixed-width' ? ' is-active' : ''
          }`}
          aria-pressed={motion === 'fixed-width'}
          title="fixed tile width — scroll speed shows loop length"
          onClick={() => onMotionChange('fixed-width')}
        >
          width
        </button>
      </div>
      <div className="timeline-motion-controls__zoom" aria-label="Timeline zoom">
        <button
          type="button"
          className="timeline-motion-controls__zoom-btn"
          disabled={!canZoomOut}
          aria-label="Zoom out"
          onClick={() =>
            onZoomStopChange(stepTimelineZoomStop(zoomStop, 'down'))
          }
        >
          −
        </button>
        <span className="timeline-motion-controls__zoom-readout" aria-live="polite">
          {formatZoomReadout(zoomStop)}
        </span>
        <button
          type="button"
          className="timeline-motion-controls__zoom-btn"
          disabled={!canZoomIn}
          aria-label="Zoom in"
          onClick={() => onZoomStopChange(stepTimelineZoomStop(zoomStop, 'up'))}
        >
          +
        </button>
      </div>
    </div>
  )
}
