import type { LoopPattern, PatternNote } from '../audio/patternTypes'
import {
  MELODY_BPM_MAX,
  minBpmForLoopDuration,
  minLoopDurationForBpm,
} from '../lib/gridLayout'
import { EditorSubheader } from './EditorSubheader'
import { MelodyGrid } from './MelodyGrid'
import './LoopEditor.css'

type LoopEditorProps = {
  pattern: LoopPattern
  loopDuration: number
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
}

function clampBpm(bpm: number, loopDuration: number): number {
  const min = minBpmForLoopDuration(loopDuration)
  return Math.min(MELODY_BPM_MAX, Math.max(min, Math.round(bpm)))
}

export function LoopEditor({
  pattern,
  loopDuration,
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
}: LoopEditorProps) {
  const melodyWindowSec = minLoopDurationForBpm(pattern.bpm)
  const loopDurationMin = Math.max(2, melodyWindowSec)
  const bpmMin = minBpmForLoopDuration(loopDuration)

  function handleLoopDurationChange(next: number) {
    if (!Number.isFinite(next)) {
      return
    }

    const clamped = Math.max(loopDurationMin, next)
    onLoopDurationChange(clamped)

    const nextBpmMin = minBpmForLoopDuration(clamped)
    if (pattern.bpm < nextBpmMin) {
      onBpmChange(nextBpmMin)
    }
  }

  function handleBpmChange(next: number) {
    if (!Number.isFinite(next)) {
      return
    }

    const clamped = clampBpm(next, loopDuration)
    onBpmChange(clamped)

    const nextMelodyWindow = minLoopDurationForBpm(clamped)
    if (loopDuration < nextMelodyWindow) {
      onLoopDurationChange(Math.max(2, nextMelodyWindow))
    }
  }

  return (
    <div className="loop-editor" aria-label={`${pattern.label} editor`}>
      <EditorSubheader
        bpm={pattern.bpm}
        bpmMin={bpmMin}
        root={pattern.root}
        scale={pattern.scale}
        octaveShift={pattern.octaveShift}
        instrument={pattern.instrument}
        loopDuration={loopDuration}
        loopDurationMin={loopDurationMin}
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
      />

      <MelodyGrid
        pattern={pattern}
        loopTimeSec={loopTimeSec}
        showPlayhead={showPlayhead}
        bpm={pattern.bpm}
        disabled={disabled}
        onNotesChange={onNotesChange}
      />
    </div>
  )
}
