import { useState } from 'react'
import { melodyBounds, type LoopPattern } from '../audio/patternTypes'
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

type TapeLoopRowProps = {
  pattern: LoopPattern
  loop: TapeLoop
  running: boolean
  expanded: boolean
  onRunningChange: (running: boolean) => void
  onExpandedChange: (expanded: boolean) => void
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
  onDelete,
  disabled = false,
}: TapeLoopRowProps) {
  const [duration, setDuration] = useState(loop.duration)
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
    setDuration(next)
    loop.setDuration(next)
  }

  return (
    <article
      key={running ? lapFlashKey : undefined}
      className={`tape-loop-row${running ? ' tape-loop-row--lap' : ''}${expanded ? ' is-expanded' : ''}${running ? ' is-running' : ''}`}
      aria-label={pattern.label}
    >
      <button
        type="button"
        className="tape-loop-row__delete"
        disabled={disabled}
        aria-label={`Delete ${pattern.label}`}
        onClick={onDelete}
      >
        ×
      </button>

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
            {duration.toFixed(1)}s
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

        <button
          type="button"
          className="tape-loop-row__expand"
          aria-expanded={expanded}
          aria-label={expanded ? `Collapse ${pattern.label}` : `Expand ${pattern.label}`}
          onClick={() => onExpandedChange(!expanded)}
        >
          {expanded ? '▴' : '▾'}
        </button>
      </div>

      {expanded ? (
        <div className="tape-loop-row__editor">
          <LoopEditor
            pattern={pattern}
            loopDuration={duration}
            loopTimeSec={loopTimeSec}
            showPlayhead={running}
            disabled={disabled}
            onLoopDurationChange={handleLoopDurationChange}
          />
        </div>
      ) : null}
    </article>
  )
}
