import { Dial } from './Dial'
import './LoopEditor.css'

type DurationControlsProps = {
  loopDuration: number
  melodyWindowSec: number
  loopDurationMin: number
  loopDurationMax?: number
  disabled?: boolean
  onLoopDurationChange: (sec: number) => void
}

export function DurationControls({
  loopDuration,
  melodyWindowSec,
  loopDurationMin,
  loopDurationMax = 60,
  disabled = false,
  onLoopDurationChange,
}: DurationControlsProps) {
  return (
    <div className="loop-editor__durations">
      <div className="loop-editor__duration-readout">
        <span className="loop-editor__duration-value">
          {melodyWindowSec.toFixed(1)}s
        </span>
        <span className="loop-editor__duration-sep">/</span>
        <span className="loop-editor__duration-value loop-editor__duration-value--loop">
          {loopDuration.toFixed(1)}s
        </span>
        <span className="loop-editor__duration-hint">melody / loop</span>
      </div>

      <Dial
        label="loop"
        value={loopDuration}
        min={loopDurationMin}
        max={loopDurationMax}
        step={0.5}
        disabled={disabled}
        formatReadout={(v) => `${v.toFixed(1)}`}
        onChange={onLoopDurationChange}
      />

      <div className="loop-editor__duration-static" aria-label="Melody window">
        <span className="loop-editor__duration-static-value">
          {melodyWindowSec.toFixed(1)}
        </span>
        <span className="loop-editor__duration-static-label">melody</span>
      </div>
    </div>
  )
}
