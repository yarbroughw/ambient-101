import type { LoopPattern, PatternNote } from '../audio/patternTypes'
import { normalizeInstrument } from '../audio/instruments/types'
import {
  instrumentEnvelope,
  instrumentFilterFrequency,
} from '../audio/instruments/createInstrumentPolySynth'
import {
  LOOP_COLS_MAX,
  MELODY_BPM_MAX,
  bpmForFill,
  melodyFill,
  melodyWindowDuration,
  minBpmForLoopDuration,
  minFillForLoopDuration,
} from '../lib/gridLayout'
import {
  clampPaceScale,
  LOOP_DURATION_MAX,
  LOOP_DURATION_MAX_MS,
  loopDurationMsFromDisplay,
  paceToHundredths,
  storedLoopDurationSec,
  type PaceOptions,
} from '../lib/globalPace'
import { EditorSubheader } from './EditorSubheader'
import { MelodyGrid } from './MelodyGrid'
import './LoopEditor.css'

const MIN_LOOP_DURATION = 2

function clampStoredBpm(
  bpm: number,
  loopDurationSec: number,
  loopCols: number,
): number {
  return Math.min(
    MELODY_BPM_MAX,
    Math.max(minBpmForLoopDuration(loopDurationSec, loopCols), bpm),
  )
}

type LoopEditorProps = {
  pattern: LoopPattern
  paceOptions: PaceOptions
  playbackLoopDuration: number
  playbackBpm: number
  loopTimeSec: number
  showPlayhead: boolean
  disabled?: boolean
  onNotesChange: (notes: PatternNote[]) => void
  onRootChange: (root: string) => void
  onScaleChange: (scale: string) => void
  onOctaveShiftChange: (octaveShift: number) => void
  onBpmChange: (bpm: number) => void
  onLoopTimingChange: (loopDurationMs: number, bpm: number) => void
  onReverbChange: (reverb: number) => void
  onDelayChange: (delay: number) => void
  onInstrumentChange: (instrument: string) => void
  onCutoffChange: (hz: number) => void
  onResonanceChange: (q: number) => void
  onChorusChange: (amount: number) => void
  onAttackChange: (attack: number) => void
  onReleaseChange: (release: number) => void
  onLoopColsChange: (loopCols: number) => void
}

export function LoopEditor({
  pattern,
  paceOptions,
  playbackLoopDuration,
  playbackBpm,
  loopTimeSec,
  showPlayhead,
  disabled = false,
  onNotesChange,
  onRootChange,
  onScaleChange,
  onOctaveShiftChange,
  onBpmChange,
  onLoopTimingChange,
  onReverbChange,
  onDelayChange,
  onInstrumentChange,
  onCutoffChange,
  onResonanceChange,
  onChorusChange,
  onAttackChange,
  onReleaseChange,
  onLoopColsChange,
}: LoopEditorProps) {
  const paceScale = clampPaceScale(paceOptions.paceScale)
  const paceHundredths = paceToHundredths(paceScale)
  const loopCols = pattern.loopCols
  const storedSec = storedLoopDurationSec(pattern.loopDurationMs)
  const fill = melodyFill(playbackLoopDuration, playbackBpm, loopCols)
  const fillMin = minFillForLoopDuration(playbackLoopDuration, loopCols)
  const melodySeconds = melodyWindowDuration(playbackBpm, loopCols)
  const loopDurationFloor = paceOptions.lockMelodyTempo
    ? melodyWindowDuration(pattern.bpm, loopCols)
    : loopCols < LOOP_COLS_MAX
      ? melodyWindowDuration(MELODY_BPM_MAX, loopCols)
      : MIN_LOOP_DURATION
  const displayLoopDurationMin = loopDurationFloor / paceScale
  const displayLoopDurationMax = LOOP_DURATION_MAX / paceScale

  // Voice overrides fall back to the instrument's recipe defaults for display
  // when unset (absent == recipe default; see patternTypes).
  const instrumentId = normalizeInstrument(pattern.instrument)
  const envelopeDefaults = instrumentEnvelope(instrumentId)
  const cutoffValue = pattern.cutoff ?? instrumentFilterFrequency(instrumentId)
  const resonanceValue = pattern.resonance ?? 1
  const chorusValue = pattern.chorus ?? 0
  const attackValue = pattern.attack ?? envelopeDefaults.attack
  const releaseValue = pattern.release ?? envelopeDefaults.release

  // The fill dial controls how much of the tape period the melody window
  // occupies. We translate a target (playback-space) fill into a stored bpm,
  // leaving the period (cooldown) untouched. 100% == seamless.
  function handleFillChange(targetFill: number) {
    if (!Number.isFinite(targetFill)) {
      return
    }

    const targetPlaybackBpm = bpmForFill(playbackLoopDuration, targetFill, loopCols)
    const storedBpm = paceOptions.lockMelodyTempo
      ? targetPlaybackBpm
      : (targetPlaybackBpm * 100) / paceHundredths
    onBpmChange(
      clampStoredBpm(storedBpm, storedSec, loopCols),
    )
  }

  function handleLoopDurationChange(displayNext: number) {
    if (!Number.isFinite(displayNext)) {
      return
    }

    let storedMs = loopDurationMsFromDisplay(displayNext, paceHundredths)

    if (paceOptions.lockMelodyTempo) {
      const minMs = loopDurationMsFromDisplay(
        melodyWindowDuration(pattern.bpm, loopCols),
        paceHundredths,
      )
      storedMs = Math.min(LOOP_DURATION_MAX_MS, Math.max(minMs, storedMs))
      onLoopTimingChange(storedMs, pattern.bpm)
      return
    }

    const minPlaybackSec = loopCols < LOOP_COLS_MAX ? 0 : MIN_LOOP_DURATION
    const minMs =
      minPlaybackSec > 0
        ? loopDurationMsFromDisplay(minPlaybackSec, paceHundredths)
        : 0
    storedMs = Math.min(LOOP_DURATION_MAX_MS, Math.max(minMs, storedMs))

    const nextStoredSec = storedMs / 1000
    const currentFill = melodyFill(storedSec, pattern.bpm, loopCols)
    const nextBpm = clampStoredBpm(
      bpmForFill(nextStoredSec, currentFill, loopCols),
      nextStoredSec,
      loopCols,
    )
    onLoopTimingChange(storedMs, nextBpm)
  }

  return (
    <div className="loop-editor" aria-label={`${pattern.label} editor`}>
      <EditorSubheader
        fill={fill}
        fillMin={fillMin}
        melodySeconds={melodySeconds}
        root={pattern.root}
        scale={pattern.scale}
        octaveShift={pattern.octaveShift}
        instrument={pattern.instrument}
        loopDuration={playbackLoopDuration}
        loopDurationMin={displayLoopDurationMin}
        loopDurationMax={displayLoopDurationMax}
        disabled={disabled}
        onRootChange={onRootChange}
        onScaleChange={onScaleChange}
        onOctaveShiftChange={onOctaveShiftChange}
        onFillChange={handleFillChange}
        onLoopDurationChange={handleLoopDurationChange}
        reverb={pattern.reverb}
        delay={pattern.delay}
        cutoff={cutoffValue}
        resonance={resonanceValue}
        chorus={chorusValue}
        attack={attackValue}
        release={releaseValue}
        onReverbChange={onReverbChange}
        onDelayChange={onDelayChange}
        onInstrumentChange={onInstrumentChange}
        onCutoffChange={onCutoffChange}
        onResonanceChange={onResonanceChange}
        onChorusChange={onChorusChange}
        onAttackChange={onAttackChange}
        onReleaseChange={onReleaseChange}
      />

      <MelodyGrid
        pattern={pattern}
        loopTimeSec={loopTimeSec}
        showPlayhead={showPlayhead}
        bpm={playbackBpm}
        loopCols={loopCols}
        periodSec={playbackLoopDuration}
        disabled={disabled}
        onNotesChange={onNotesChange}
        onLoopColsChange={onLoopColsChange}
      />
    </div>
  )
}
