import { INSTRUMENT_IDS } from '../audio/instruments/types'
import {
  formatDisplayLoopDuration,
  LOOP_DURATION_DRAG_STEP,
  LOOP_DURATION_STEP,
} from '../lib/globalPace'
import {
  clampOctaveShift,
  OCTAVE_SHIFT_MAX,
  OCTAVE_SHIFT_MIN,
  ROOT_PITCH_CLASSES,
} from '../lib/scaleSteps'
import { Dial } from './Dial'
import { ScaleTypeSelect } from './ScaleTypeSelect'
import './LoopEditor.css'

const FILL_STEP = 0.01

type EditorSubheaderProps = {
  fill: number
  fillMin: number
  melodySeconds: number
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
  onFillChange: (fill: number) => void
  onLoopDurationChange: (sec: number) => void
  onReverbChange: (reverb: number) => void
  onDelayChange: (delay: number) => void
  onInstrumentChange: (instrument: string) => void
}

const REEL_DIAL_SIZE = 44

export function EditorSubheader({
  fill,
  fillMin,
  melodySeconds,
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
  onFillChange,
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

      <div className="loop-editor__center">
        <div className="reel-lane__label">
          <Dial
            label="fill"
            subLabel={`= ${melodySeconds.toFixed(1)}s`}
            ariaLabel="Melody fill"
            value={fill}
            min={0}
            max={1}
            softMin={fillMin}
            step={FILL_STEP}
            size={REEL_DIAL_SIZE}
            disabled={disabled || fillMin >= 1}
            editableReadout
            formatReadout={(value) => `${Math.round(value * 100)}%`}
            parseReadoutInput={(text) => {
              const parsed = Number.parseFloat(text.trim().replace(/%$/, ''))
              if (!Number.isFinite(parsed)) {
                return null
              }
              // "55" and "55%" mean 55 percent; "0.55" means the same fill.
              return parsed > 1 ? parsed / 100 : parsed
            }}
            onChange={onFillChange}
          />
        </div>

        <div className="reel-lane__reel">
          <Dial
            label="tape"
            ariaLabel="Tape length"
            value={loopDuration}
            min={loopDurationMin}
            max={loopDurationMax}
            step={LOOP_DURATION_DRAG_STEP}
            readoutStep={LOOP_DURATION_STEP}
            size={REEL_DIAL_SIZE}
            disabled={disabled}
            editableReadout
            formatReadout={(value) => formatDisplayLoopDuration(value)}
            parseReadoutInput={(text) => {
              const parsed = Number.parseFloat(text.trim().replace(/s$/i, ''))
              return Number.isFinite(parsed) ? parsed : null
            }}
            onChange={onLoopDurationChange}
          />
        </div>

        <div className="loop-editor__melody-anchor" aria-hidden />
      </div>

      <div className="reel-lane__tape loop-editor__tape-slot">
        <div className="loop-editor__melody-controls">
          <div
            className="loop-editor__key-column"
            role="group"
            aria-label="Key"
          >
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

          <div
            className="loop-editor__tone-column"
            role="group"
            aria-label="Tone"
          >
            <label className="loop-editor__inline-field loop-editor__inst-field">
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
