import type { LoopPattern, PatternNote } from '../audio/patternTypes'
import { minLoopDurationForBpm } from '../lib/gridLayout'
import { DurationControls } from './DurationControls'
import { EditorToolbar } from './EditorToolbar'
import { MelodyGrid } from './MelodyGrid'
import './LoopEditor.css'

type LoopEditorProps = {
  pattern: LoopPattern
  loopDuration: number
  loopTimeSec: number
  showPlayhead: boolean
  disabled?: boolean
  onNotesChange: (notes: PatternNote[]) => void
  onScaleChange: (scale: string) => void
  onOctaveShiftChange: (octaveShift: number) => void
  onLoopDurationChange: (sec: number) => void
}

export function LoopEditor({
  pattern,
  loopDuration,
  loopTimeSec,
  showPlayhead,
  disabled = false,
  onNotesChange,
  onScaleChange,
  onOctaveShiftChange,
  onLoopDurationChange,
}: LoopEditorProps) {
  const melodyWindowSec = minLoopDurationForBpm(pattern.bpm)
  const loopDurationMin = Math.max(2, melodyWindowSec)

  function handleLoopDurationChange(next: number) {
    if (!Number.isFinite(next) || next < loopDurationMin) {
      return
    }
    onLoopDurationChange(next)
  }

  return (
    <div className="loop-editor" aria-label={`${pattern.label} editor`}>
      <EditorToolbar
        bpm={pattern.bpm}
        scale={pattern.scale}
        octaveShift={pattern.octaveShift}
        instrument={pattern.instrument}
        disabled={disabled}
        onScaleChange={onScaleChange}
        onOctaveShiftChange={onOctaveShiftChange}
      />

      <MelodyGrid
        pattern={pattern}
        loopTimeSec={loopTimeSec}
        showPlayhead={showPlayhead}
        bpm={pattern.bpm}
        disabled={disabled}
        onNotesChange={onNotesChange}
      />

      <DurationControls
        loopDuration={loopDuration}
        melodyWindowSec={melodyWindowSec}
        loopDurationMin={loopDurationMin}
        disabled={disabled}
        onLoopDurationChange={handleLoopDurationChange}
      />
    </div>
  )
}
