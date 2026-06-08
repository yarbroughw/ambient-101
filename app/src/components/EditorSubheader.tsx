import { INSTRUMENT_IDS } from '../audio/instruments/types'
import {
  formatDisplayBpm,
  formatDisplayLoopDuration,
} from '../lib/globalPace'
import {
  clampOctaveShift,
  OCTAVE_SHIFT_MAX,
  OCTAVE_SHIFT_MIN,
  ROOT_PITCH_CLASSES,
} from '../lib/scaleSteps'
import { MELODY_BPM_MAX } from '../lib/gridLayout'
import { Dial } from './Dial'
import { ScaleTypeSelect } from './ScaleTypeSelect'
import './LoopEditor.css'

type EditorSubheaderProps = {
  bpm: number
  bpmMin: number
  root: string
  scale: string
  octaveShift: number
  instrument: string
  loopDuration: number
  loopDurationMin: number
  loopDurationMax?: number
  reverb: number
  delay: number
  disabled?: boolean
  onRootChange: (root: string) => void
  onScaleChange: (scale: string) => void
  onOctaveShiftChange: (octaveShift: number) => void
  onBpmChange: (bpm: number) => void
  onLoopDurationChange: (sec: number) => void
  onReverbChange: (reverb: number) => void
  onDelayChange: (delay: number) => void
  onInstrumentChange: (instrument: string) => void
}

const REEL_DIAL_SIZE = 44

export function EditorSubheader({
  bpm,
  bpmMin,
  root,
  scale,
  octaveShift,
  instrument,
  loopDuration,
  loopDurationMin,
  loopDurationMax = 60,
  reverb,
  delay,
  disabled = false,
  onRootChange,
  onScaleChange,
  onOctaveShiftChange,
  onBpmChange,
  onLoopDurationChange,
  onReverbChange,
  onDelayChange,
  onInstrumentChange,
}: EditorSubheaderProps) {
  function handleOctaveDown() {
    onOctaveShiftChange(clampOctaveShift(octaveShift - 1))
  }

  function handleOctaveUp() {
    onOctaveShiftChange(clampOctaveShift(octaveShift + 1))
  }

  const octaveReadout =
    octaveShift > 0 ? `+${octaveShift}` : String(octaveShift)

  return (
    <div className="loop-editor__subheader reel-lane" aria-label="Editor controls">
      <div className="reel-lane__controls" aria-hidden />

      <div className="reel-lane__level" aria-hidden />

      <div className="reel-lane__reel">
        <Dial
          label="cooldown"
          value={loopDuration}
          min={loopDurationMin}
          max={loopDurationMax}
          step={0.5}
          size={REEL_DIAL_SIZE}
          disabled={disabled}
          formatReadout={(value) => formatDisplayLoopDuration(value)}
          onChange={onLoopDurationChange}
        />
      </div>

      <div className="reel-lane__label">
        <Dial
          label="bpm"
          value={bpm}
          min={bpmMin}
          max={MELODY_BPM_MAX}
          step={1}
          size={REEL_DIAL_SIZE}
          disabled={disabled}
          formatReadout={(value) => `${formatDisplayBpm(value)}`}
          onChange={onBpmChange}
        />
      </div>

      <div className="reel-lane__tape loop-editor__tape-slot">
        <div className="loop-editor__melody-controls">
          <div className="loop-editor__tonality-column">
            <label className="loop-editor__inline-field">
              <span className="loop-editor__inline-label">root</span>
              <select
                className="loop-editor__select loop-editor__select--editable loop-editor__select--root"
                value={root}
                disabled={disabled}
                aria-label="Root"
                onChange={(event) => onRootChange(event.target.value)}
              >
                {ROOT_PITCH_CLASSES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="loop-editor__inline-field">
              <span className="loop-editor__inline-label">scale</span>
              <ScaleTypeSelect
                className="loop-editor__select loop-editor__select--editable"
                value={scale}
                disabled={disabled}
                ariaLabel="Scale"
                onChange={onScaleChange}
              />
            </label>
          </div>

          <div className="loop-editor__voice-column">
            <label className="loop-editor__inline-field">
              <span className="loop-editor__inline-label">inst</span>
              <select
                className="loop-editor__select loop-editor__select--editable"
                value={instrument}
                disabled={disabled}
                aria-label="Instrument"
                onChange={(event) => onInstrumentChange(event.target.value)}
              >
                {INSTRUMENT_IDS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <div
              className="loop-editor__octave"
              role="group"
              aria-label="Octave shift"
            >
              <span className="loop-editor__inline-label">oct</span>
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

          <div className="loop-editor__fx-column">
            <Dial
              label="reverb"
              value={reverb}
              disabled={disabled}
              onChange={onReverbChange}
            />
            <Dial
              label="delay"
              value={delay}
              disabled={disabled}
              onChange={onDelayChange}
            />
          </div>
        </div>

        <div className="reel-lane__meta loop-editor__meta-spacer" aria-hidden />
      </div>

      <div className="reel-lane__actions" aria-hidden />
    </div>
  )
}
