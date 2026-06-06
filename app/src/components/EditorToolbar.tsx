import {
  clampOctaveShift,
  OCTAVE_SHIFT_MAX,
  OCTAVE_SHIFT_MIN,
  scaleLabel,
  WORKSHOP_SCALES,
} from '../lib/scaleSteps'
import './LoopEditor.css'

type EditorToolbarProps = {
  bpm: number
  scale: string
  octaveShift: number
  instrument: string
  disabled?: boolean
  onScaleChange: (scale: string) => void
  onOctaveShiftChange: (octaveShift: number) => void
}

export function EditorToolbar({
  bpm,
  scale,
  octaveShift,
  instrument,
  disabled = false,
  onScaleChange,
  onOctaveShiftChange,
}: EditorToolbarProps) {
  function handleOctaveDown() {
    onOctaveShiftChange(clampOctaveShift(octaveShift - 1))
  }

  function handleOctaveUp() {
    onOctaveShiftChange(clampOctaveShift(octaveShift + 1))
  }

  const octaveReadout =
    octaveShift > 0 ? `+${octaveShift}` : String(octaveShift)

  return (
    <div className="loop-editor__toolbar">
      <label className="loop-editor__field">
        <span className="loop-editor__field-label">instrument</span>
        <select
          className="loop-editor__select"
          value={instrument}
          disabled
          aria-label="Instrument"
        >
          <option value="pad">pad</option>
          <option value="pluck">pluck</option>
        </select>
      </label>

      <label className="loop-editor__field">
        <span className="loop-editor__field-label">scale</span>
        <select
          className="loop-editor__select loop-editor__select--editable"
          value={scale}
          disabled={disabled}
          aria-label="Scale"
          onChange={(e) => onScaleChange(e.target.value)}
        >
          {WORKSHOP_SCALES.map((option) => (
            <option key={option} value={option}>
              {scaleLabel(option)}
            </option>
          ))}
        </select>
      </label>

      <div className="loop-editor__field loop-editor__field--meta">
        <span className="loop-editor__meta">BPM: {bpm}</span>
      </div>

      <div
        className="loop-editor__octave"
        role="group"
        aria-label="Octave shift"
      >
        <span className="loop-editor__field-label">octave</span>
        <div className="loop-editor__octave-controls">
          <button
            type="button"
            className="loop-editor__octave-btn"
            disabled={disabled || octaveShift <= OCTAVE_SHIFT_MIN}
            aria-label="Octave down"
            onClick={handleOctaveDown}
          >
            ▼
          </button>
          <span className="loop-editor__octave-readout">{octaveReadout}</span>
          <button
            type="button"
            className="loop-editor__octave-btn"
            disabled={disabled || octaveShift >= OCTAVE_SHIFT_MAX}
            aria-label="Octave up"
            onClick={handleOctaveUp}
          >
            ▲
          </button>
        </div>
      </div>
    </div>
  )
}
