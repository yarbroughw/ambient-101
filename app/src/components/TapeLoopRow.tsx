import { useState } from 'react'
import {
  melodyBounds,
  type LoopPattern,
  type PatternNote,
} from '../audio/patternTypes'
import { minLoopDurationForBpm } from '../lib/gridLayout'
import type { TapeLoop } from '../audio/tapeLoop'
import { useLoopLevel } from '../hooks/useLoopLevel'
import { useLoopProgress } from '../hooks/useLoopProgress'
import { LoopEditor } from './LoopEditor'
import { LoopLabel } from './LoopLabel'
import { LoopLevelMeter } from './LoopLevelMeter'
import { MiniMelodyView } from './MiniMelodyView'
import './LoopEditor.css'
import './LoopLevelMeter.css'
import './MelodyGrid.css'

function PencilIcon() {
  return (
    <svg
      className="tape-loop-row__action-icon"
      viewBox="0 0 16 16"
      aria-hidden
    >
      <path
        d="M11.2 2.3a1.2 1.2 0 0 1 1.7 0l.8.8a1.2 1.2 0 0 1 0 1.7L6.4 12.3 3 13l.7-3.4 7.5-7.3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      className="tape-loop-row__action-icon"
      viewBox="0 0 16 16"
      aria-hidden
    >
      <path
        d="M3.5 4.5h9M6 4.5V3.8a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8V4.5M6.2 7.2v3.6M8 7.2v3.6M9.8 7.2v3.6M4.8 4.5l.6 7.2a.8.8 0 0 0 .8.7h3.6a.8.8 0 0 0 .8-.7l.6-7.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type TapeLoopRowProps = {
  pattern: LoopPattern
  loop: TapeLoop
  running: boolean
  expanded: boolean
  onRunningChange: (running: boolean) => void
  onExpandedChange: (expanded: boolean) => void
  onNotesChange: (notes: PatternNote[]) => void
  onLoopDurationChange: (sec: number) => void
  onDelete: () => void
  disabled?: boolean
}

export function TapeLoopRow({
  pattern,
  loop,
  running,
  expanded,
  onRunningChange,
  onExpandedChange,
  onNotesChange,
  onLoopDurationChange,
  onDelete,
  disabled = false,
}: TapeLoopRowProps) {
  const [testNonce, setTestNonce] = useState(0)
  const { angleDeg, lapFlashKey, loopTimeSec, melodyPlaybackActive } =
    useLoopProgress(loop, running, testNonce)
  const { level, peak } = useLoopLevel(loop, melodyPlaybackActive)
  const { end: melodyEnd } = melodyBounds(pattern.notes)

  function handleLoopDurationChange(next: number) {
    const floor = Math.max(2, minLoopDurationForBpm(pattern.bpm))
    if (!Number.isFinite(next) || next < floor) {
      return
    }
    onLoopDurationChange(next)
  }

  return (
    <article
      key={running ? lapFlashKey : undefined}
      className={`tape-loop-row${running ? ' tape-loop-row--lap' : ''}${expanded ? ' is-expanded' : ''}${running ? ' is-running' : ''}`}
      aria-label={pattern.label}
    >
      <div className="tape-loop-row__summary">
        <div className="tape-loop-row__controls">
          <button
            type="button"
            className="tape-loop-btn tape-loop-btn--play"
            disabled={disabled || running}
            aria-label={`Play ${pattern.label}`}
            onClick={() => {
              loop.start()
              onRunningChange(true)
            }}
          >
            ▶
          </button>
          <button
            type="button"
            className="tape-loop-btn tape-loop-btn--stop"
            disabled={disabled || !running}
            aria-label={`Stop ${pattern.label}`}
            onClick={() => {
              loop.stop()
              onRunningChange(false)
            }}
          >
            ◼
          </button>
          <button
            type="button"
            className="tape-loop-btn tape-loop-btn--test"
            disabled={disabled}
            aria-label={`Test ${pattern.label}`}
            onClick={() => {
              loop.test(melodyEnd)
              setTestNonce((n) => n + 1)
            }}
          >
            ↺
          </button>
        </div>

        <LoopLevelMeter level={level} peak={peak} active={melodyPlaybackActive} />

        <div className="tape-loop-row__reel" aria-hidden>
          <div className="tape-loop-row__ring" />
          <div className="tape-loop-row__tick" />
          {running ? (
            <div
              className="tape-loop-row__dot"
              style={{ transform: `rotate(${angleDeg}deg)` }}
            >
              <span
                key={lapFlashKey}
                className="tape-loop-row__dot-head tape-loop-row__dot-head--lap"
              />
            </div>
          ) : null}
          <span className="tape-loop-row__duration-readonly">
            {pattern.loopDuration.toFixed(1)}s
          </span>
        </div>

        <LoopLabel label={pattern.label} />

        <div className="tape-loop-row__tape-content">
          <MiniMelodyView
            notes={pattern.notes}
            loopTimeSec={loopTimeSec}
            showPlayhead={melodyPlaybackActive}
          />
          <div className="tape-loop-row__content-meta">
            <span>BPM: {pattern.bpm}</span>
            <span>instrument: {pattern.instrument}</span>
            <span>scale: {pattern.scale}</span>
          </div>
        </div>

        <div className="tape-loop-row__actions">
          <button
            type="button"
            className={`tape-loop-row__action tape-loop-row__action--edit${expanded ? ' is-active' : ''}`}
            aria-expanded={expanded}
            aria-label={expanded ? `Close ${pattern.label} editor` : `Edit ${pattern.label}`}
            disabled={disabled}
            onClick={() => onExpandedChange(!expanded)}
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            className="tape-loop-row__action tape-loop-row__action--delete"
            disabled={disabled}
            aria-label={`Delete ${pattern.label}`}
            onClick={onDelete}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="tape-loop-row__editor">
          <LoopEditor
            pattern={pattern}
            loopDuration={pattern.loopDuration}
            loopTimeSec={loopTimeSec}
            showPlayhead={running}
            disabled={disabled}
            onNotesChange={onNotesChange}
            onLoopDurationChange={handleLoopDurationChange}
          />
        </div>
      ) : null}
    </article>
  )
}
