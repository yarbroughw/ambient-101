import type { LoopPattern } from '../audio/patternTypes'
import {
  canStepPaceScale,
  formatPaceScale,
  stepPaceScale,
} from '../lib/globalPace'
import './GlobalPaceControl.css'

type GlobalPaceControlProps = {
  paceScale: number
  paceAffectsMelody: boolean
  patterns: LoopPattern[]
  disabled?: boolean
  onPaceScaleChange: (paceScale: number) => void
}

export function GlobalPaceControl({
  paceScale,
  paceAffectsMelody,
  patterns,
  disabled = false,
  onPaceScaleChange,
}: GlobalPaceControlProps) {
  const canIncrease = canStepPaceScale(patterns, paceScale, 'up', paceAffectsMelody)
  const canDecrease = canStepPaceScale(patterns, paceScale, 'down', paceAffectsMelody)

  return (
    <div className="toolbar__pace-wrap" aria-label="Global pace">
      <span className="toolbar__tonality-label toolbar__pace-label">pace</span>
      <div className="toolbar__pace">
        <button
          type="button"
          className="toolbar__pace-btn"
          disabled={disabled || !canIncrease}
          aria-label="Increase pace"
          onClick={() => onPaceScaleChange(stepPaceScale(paceScale, 'up'))}
        >
          ▲
        </button>
        <span className="toolbar__pace-readout" aria-live="polite">
          {formatPaceScale(paceScale)}
        </span>
        <button
          type="button"
          className="toolbar__pace-btn"
          disabled={disabled || !canDecrease}
          aria-label="Decrease pace"
          onClick={() => onPaceScaleChange(stepPaceScale(paceScale, 'down'))}
        >
          ▼
        </button>
      </div>
    </div>
  )
}
