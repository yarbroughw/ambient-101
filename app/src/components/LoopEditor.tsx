import type { LoopPattern, PatternNote } from '../audio/patternTypes'
import {
  MELODY_BPM_MAX,
  minBpmForLoopDuration,
  minLoopDurationForBpm,
} from '../lib/gridLayout'
import {
  composedBpmFromDisplay,
  composedLoopDurationFromDisplay,
  clampPaceScale,
  LOOP_DURATION_MAX,
  type PaceOptions,
} from '../lib/globalPace'
import { EditorSubheader } from './EditorSubheader'
import { MelodyGrid } from './MelodyGrid'
import './LoopEditor.css'

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
  onLoopDurationChange: (sec: number) => void
  onReverbChange: (reverb: number) => void
  onDelayChange: (delay: number) => void
  onInstrumentChange: (instrument: string) => void
}

function clampBpm(bpm: number, loopDuration: number): number {
  const min = minBpmForLoopDuration(loopDuration)
  return Math.min(MELODY_BPM_MAX, Math.max(min, Math.round(bpm)))
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
  onLoopDurationChange,
  onReverbChange,
  onDelayChange,
  onInstrumentChange,
}: LoopEditorProps) {
  const paceScale = clampPaceScale(paceOptions.paceScale)
  const melodyWindowSec = minLoopDurationForBpm(pattern.bpm)
  const loopDurationMin = Math.max(2, melodyWindowSec)
  const bpmMin = minBpmForLoopDuration(pattern.loopDuration)
  const displayLoopDurationMin = loopDurationMin / paceScale
  const displayLoopDurationMax = LOOP_DURATION_MAX / paceScale
  const displayBpmMin = paceOptions.paceAffectsMelody
    ? Math.ceil(bpmMin * paceScale)
    : bpmMin

  function handleLoopDurationChange(displayNext: number) {
    if (!Number.isFinite(displayNext)) {
      return
    }

    const composed = composedLoopDurationFromDisplay(displayNext, paceScale)
    const clamped = Math.max(loopDurationMin, composed)
    onLoopDurationChange(clamped)

    const nextBpmMin = minBpmForLoopDuration(clamped)
    if (pattern.bpm < nextBpmMin) {
      onBpmChange(nextBpmMin)
    }
  }

  function handleBpmChange(displayNext: number) {
    if (!Number.isFinite(displayNext)) {
      return
    }

    const composed = composedBpmFromDisplay(displayNext, paceOptions)
    const clamped = clampBpm(composed, pattern.loopDuration)
    onBpmChange(clamped)

    const nextMelodyWindow = minLoopDurationForBpm(clamped)
    if (pattern.loopDuration < nextMelodyWindow) {
      onLoopDurationChange(Math.max(2, nextMelodyWindow))
    }
  }

  return (
    <div className="loop-editor" aria-label={`${pattern.label} editor`}>
      <EditorSubheader
        bpm={playbackBpm}
        bpmMin={displayBpmMin}
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
        onBpmChange={handleBpmChange}
        onLoopDurationChange={handleLoopDurationChange}
        reverb={pattern.reverb}
        delay={pattern.delay}
        onReverbChange={onReverbChange}
        onDelayChange={onDelayChange}
        onInstrumentChange={onInstrumentChange}
      />

      <MelodyGrid
        pattern={pattern}
        loopTimeSec={loopTimeSec}
        showPlayhead={showPlayhead}
        bpm={playbackBpm}
        disabled={disabled}
        onNotesChange={onNotesChange}
      />
    </div>
  )
}
