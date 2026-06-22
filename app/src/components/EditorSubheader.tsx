import { useState } from 'react'
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
import { Slider } from './Slider'
import { ScaleTypeSelect } from './ScaleTypeSelect'
import './LoopEditor.css'

// Grouped editor control panel: timing · key · voice (row 1) and the
// collapsible filter · envelope · fx (row 2), toggled from the voice group.
const FILL_STEP = 0.01
const PANEL_DIAL_SIZE = 54

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
  cutoff: number
  resonance: number
  chorus: number
  gain: number
  attack: number
  release: number
  disabled?: boolean
  onRootChange: (root: string) => void
  onScaleChange: (scale: string) => void
  onOctaveShiftChange: (octaveShift: number) => void
  onFillChange: (fill: number) => void
  onLoopDurationChange: (sec: number) => void
  onReverbChange: (reverb: number) => void
  onDelayChange: (delay: number) => void
  onInstrumentChange: (instrument: string) => void
  onCutoffChange: (hz: number) => void
  onResonanceChange: (q: number) => void
  onChorusChange: (amount: number) => void
  onGainChange: (amount: number) => void
  onAttackChange: (attack: number) => void
  onReleaseChange: (release: number) => void
}

function formatSeconds(value: number): string {
  return `${value.toFixed(2)}s`
}

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
  cutoff,
  resonance,
  chorus,
  gain,
  attack,
  release,
  disabled = false,
  onRootChange,
  onScaleChange,
  onOctaveShiftChange,
  onFillChange,
  onLoopDurationChange,
  onReverbChange,
  onDelayChange,
  onInstrumentChange,
  onCutoffChange,
  onResonanceChange,
  onChorusChange,
  onGainChange,
  onAttackChange,
  onReleaseChange,
}: EditorSubheaderProps) {
  function handleOctaveDown() {
    onOctaveShiftChange(clampOctaveShift(octaveShift - 1))
  }

  function handleOctaveUp() {
    onOctaveShiftChange(clampOctaveShift(octaveShift + 1))
  }

  const octaveReadout = octaveShift > 0 ? `+${octaveShift}` : String(octaveShift)

  // Sound-design controls (filter/envelope/fx) are hidden by default so the
  // panel opens on the musical essentials; the voice group reveals them.
  const [showSound, setShowSound] = useState(false)

  return (
    <div className="editor-panel" aria-label="Editor controls">
      {/* Row 1 — what plays: structure, pitch, source. */}
      <div className="editor-panel__row">
      {/* timing: how the melody window sits inside the tape period */}
      <section className="editor-panel__group" aria-label="Timing">
        <span className="editor-panel__group-label">timing</span>
        <div className="editor-panel__body editor-panel__body--timing">
          <Dial
            label="tape"
            ariaLabel="Tape length"
            value={loopDuration}
            min={loopDurationMin}
            max={loopDurationMax}
            step={LOOP_DURATION_DRAG_STEP}
            readoutStep={LOOP_DURATION_STEP}
            size={PANEL_DIAL_SIZE}
            disabled={disabled}
            editableReadout
            formatReadout={(value) => formatDisplayLoopDuration(value)}
            parseReadoutInput={(text) => {
              const parsed = Number.parseFloat(text.trim().replace(/s$/i, ''))
              return Number.isFinite(parsed) ? parsed : null
            }}
            onChange={onLoopDurationChange}
          />
          <Slider
            label="fill"
            ariaLabel="Melody fill"
            value={fill}
            min={0}
            max={1}
            softMin={fillMin}
            step={FILL_STEP}
            subLabel={`= ${melodySeconds.toFixed(1)}s`}
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
      </section>

      {/* key: pitch material */}
      <section className="editor-panel__group" aria-label="Key">
        <span className="editor-panel__group-label">key</span>
        <div className="editor-panel__body editor-panel__body--key">
          <label className="editor-panel__field">
            <span className="editor-panel__field-label">root</span>
            <select
              className="editor-panel__select"
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

          <label className="editor-panel__field">
            <span className="editor-panel__field-label">scale</span>
            <ScaleTypeSelect
              className="editor-panel__select"
              value={scale}
              disabled={disabled}
              ariaLabel="Scale"
              onChange={onScaleChange}
            />
          </label>

          <div className="editor-panel__field" role="group" aria-label="Octave shift">
            <span className="editor-panel__field-label">oct</span>
            <div className="editor-panel__octave">
              <button
                type="button"
                className="editor-panel__octave-btn"
                disabled={disabled || octaveShift <= OCTAVE_SHIFT_MIN}
                aria-label="Octave down"
                onClick={handleOctaveDown}
              >
                ▼
              </button>
              <span className="editor-panel__octave-readout">{octaveReadout}</span>
              <button
                type="button"
                className="editor-panel__octave-btn"
                disabled={disabled || octaveShift >= OCTAVE_SHIFT_MAX}
                aria-label="Octave up"
                onClick={handleOctaveUp}
              >
                ▲
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* voice: the synth source */}
      <section className="editor-panel__group" aria-label="Voice">
        <span className="editor-panel__group-label">voice</span>
        <div className="editor-panel__body editor-panel__body--voice">
          <label className="editor-panel__field editor-panel__field--stacked">
            <span className="editor-panel__field-label">inst</span>
            <select
              className="editor-panel__select"
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
          <button
            type="button"
            className="editor-panel__expander"
            aria-expanded={showSound}
            aria-label="Toggle sound design controls"
            onClick={() => setShowSound((open) => !open)}
          >
            <span className="editor-panel__expander-caret" aria-hidden>
              {showSound ? '▾' : '▸'}
            </span>
            edit
          </button>
        </div>
      </section>
      </div>

      {/* Row 2 — how it sounds: filter, envelope, fx. Hidden until expanded. */}
      {showSound ? (
      <div className="editor-panel__row">
      {/* level: tame the voice's own loudness (distinct from the reel fader) */}
      <section className="editor-panel__group" aria-label="Level">
        <span className="editor-panel__group-label">level</span>
        <div className="editor-panel__body">
          <Dial
            label="volume"
            value={gain}
            min={0}
            max={1}
            step={0.01}
            size={PANEL_DIAL_SIZE}
            disabled={disabled}
            formatReadout={(value) => `${Math.round(value * 100)}`}
            onChange={onGainChange}
          />
        </div>
      </section>

      {/* filter: low-pass shaping of the voice */}
      <section className="editor-panel__group" aria-label="Filter">
        <span className="editor-panel__group-label">filter</span>
        <div className="editor-panel__body">
          <Dial
            label="cutoff"
            value={cutoff}
            min={20}
            max={12000}
            step={20}
            scale="log"
            size={PANEL_DIAL_SIZE}
            disabled={disabled}
            editableReadout
            formatReadout={(value) =>
              value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${Math.round(value)}`
            }
            parseReadoutInput={(text) => {
              const t = text.trim().toLowerCase().replace(/hz$/, '')
              const parsed = Number.parseFloat(t)
              if (!Number.isFinite(parsed)) {
                return null
              }
              return t.endsWith('k') ? parsed * 1000 : parsed
            }}
            onChange={onCutoffChange}
          />
          <Dial
            label="res"
            value={resonance}
            min={0}
            max={30}
            step={0.5}
            size={PANEL_DIAL_SIZE}
            disabled={disabled}
            formatReadout={(value) => value.toFixed(1)}
            onChange={onResonanceChange}
          />
        </div>
      </section>

      {/* envelope: attack/release of the amplitude shape */}
      <section className="editor-panel__group" aria-label="Envelope">
        <span className="editor-panel__group-label">envelope</span>
        <div className="editor-panel__body">
          <Dial
            label="attack"
            value={attack}
            min={0}
            max={4}
            step={0.01}
            size={PANEL_DIAL_SIZE}
            disabled={disabled}
            editableReadout
            formatReadout={formatSeconds}
            onChange={onAttackChange}
          />
          <Dial
            label="release"
            value={release}
            min={0}
            max={10}
            step={0.05}
            size={PANEL_DIAL_SIZE}
            disabled={disabled}
            editableReadout
            formatReadout={formatSeconds}
            onChange={onReleaseChange}
          />
        </div>
      </section>

      {/* fx: shared space and movement */}
      <section className="editor-panel__group" aria-label="Effects">
        <span className="editor-panel__group-label">fx</span>
        <div className="editor-panel__body">
          <Dial
            label="reverb"
            value={reverb}
            size={PANEL_DIAL_SIZE}
            disabled={disabled}
            formatReadout={(value) => `${Math.round(value * 100)}`}
            onChange={onReverbChange}
          />
          <Dial
            label="delay"
            value={delay}
            size={PANEL_DIAL_SIZE}
            disabled={disabled}
            formatReadout={(value) => `${Math.round(value * 100)}`}
            onChange={onDelayChange}
          />
          <Dial
            label="chorus"
            value={chorus}
            size={PANEL_DIAL_SIZE}
            disabled={disabled}
            formatReadout={(value) => `${Math.round(value * 100)}`}
            onChange={onChorusChange}
          />
        </div>
      </section>
      </div>
      ) : null}
    </div>
  )
}
