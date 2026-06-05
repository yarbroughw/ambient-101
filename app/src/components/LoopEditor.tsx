import { useState } from 'react'
import type { LoopPattern } from '../audio/patternTypes'
import { minLoopDurationForBpm } from '../lib/gridLayout'
import type { ScalePresentation } from '../lib/scaleRows'
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
  onLoopDurationChange: (sec: number) => void
}

export function LoopEditor({
  pattern,
  loopDuration,
  loopTimeSec,
  showPlayhead,
  disabled = false,
  onLoopDurationChange,
}: LoopEditorProps) {
  const [presentation, setPresentation] = useState<ScalePresentation>('fold')
  const [draftNotes, setDraftNotes] = useState(pattern.notes)

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
        instrument={pattern.instrument}
        presentation={presentation}
        disabled={disabled}
        onPresentationChange={setPresentation}
      />

      <MelodyGrid
        notes={draftNotes}
        loopTimeSec={loopTimeSec}
        showPlayhead={showPlayhead}
        bpm={pattern.bpm}
        scale={pattern.scale}
        presentation={presentation}
        disabled={disabled}
        onNotesChange={setDraftNotes}
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
