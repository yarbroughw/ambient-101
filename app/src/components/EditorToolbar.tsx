import { scaleLabel, type ScalePresentation } from '../lib/scaleRows'
import './LoopEditor.css'

type EditorToolbarProps = {
  bpm: number
  scale: string
  instrument: string
  presentation: ScalePresentation
  disabled?: boolean
  onPresentationChange: (presentation: ScalePresentation) => void
}

export function EditorToolbar({
  bpm,
  scale,
  instrument,
  presentation,
  disabled = false,
  onPresentationChange,
}: EditorToolbarProps) {
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

      <div className="loop-editor__field loop-editor__field--meta">
        <span className="loop-editor__meta">BPM: {bpm}</span>
        <span className="loop-editor__meta">scale: {scaleLabel(scale)}</span>
      </div>

      <div
        className="loop-editor__segmented"
        role="group"
        aria-label="Scale presentation"
      >
        <button
          type="button"
          className={`loop-editor__segment${presentation === 'highlight' ? ' loop-editor__segment--active' : ''}`}
          disabled={disabled}
          aria-pressed={presentation === 'highlight'}
          onClick={() => onPresentationChange('highlight')}
        >
          highlight
        </button>
        <button
          type="button"
          className={`loop-editor__segment${presentation === 'fold' ? ' loop-editor__segment--active' : ''}`}
          disabled={disabled}
          aria-pressed={presentation === 'fold'}
          onClick={() => onPresentationChange('fold')}
        >
          fold
        </button>
      </div>
    </div>
  )
}
