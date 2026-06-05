import { useEffect, useState } from 'react'
import { melodyBounds, type LoopPattern } from '../audio/patternTypes'
import type { TapeLoop } from '../audio/tapeLoop'
import { useLoopLevel } from '../hooks/useLoopLevel'
import { useLoopProgress } from '../hooks/useLoopProgress'
import { LoopLevelMeter } from './LoopLevelMeter'
import { MiniMelodyView } from './MiniMelodyView'
import './LoopLevelMeter.css'

type TapeLoopRowProps = {
  pattern: LoopPattern
  loop: TapeLoop
  running: boolean
  expanded: boolean
  onRunningChange: (running: boolean) => void
  onExpandedChange: (expanded: boolean) => void
  disabled?: boolean
}

export function TapeLoopRow({
  pattern,
  loop,
  running,
  expanded,
  onRunningChange,
  onExpandedChange,
  disabled = false,
}: TapeLoopRowProps) {
  const [duration, setDuration] = useState(loop.duration)
  const [editingLength, setEditingLength] = useState(false)
  const [testNonce, setTestNonce] = useState(0)
  const { angleDeg, lapFlashKey, loopTimeSec, melodyPlaybackActive } =
    useLoopProgress(loop, running, testNonce)
  const { level, peak } = useLoopLevel(loop, melodyPlaybackActive)
  const { span: melodySpan, end: melodyEnd } = melodyBounds(pattern.notes)
  const durationMin = Math.max(2, melodySpan)

  useEffect(() => {
    if (!expanded) {
      setEditingLength(false)
    }
  }, [expanded])

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
          {expanded && editingLength ? (
            <input
              className="tape-loop-row__duration-input"
              type="number"
              min={durationMin}
              max={60}
              step={0.5}
              value={duration}
              disabled={disabled}
              autoFocus
              aria-label={`${pattern.label} loop length in seconds`}
              onBlur={() => setEditingLength(false)}
              onChange={(e) => {
                const next = Number(e.target.value)
                if (!Number.isFinite(next) || next < durationMin) {
                  return
                }
                setDuration(next)
                loop.setDuration(next)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setEditingLength(false)
                }
              }}
            />
          ) : expanded ? (
            <button
              type="button"
              className="tape-loop-row__duration"
              disabled={disabled}
              title="Click to edit loop length"
              onClick={() => setEditingLength(true)}
            >
              {duration.toFixed(1)}s
            </button>
          ) : (
            <span className="tape-loop-row__duration-readonly">
              {duration.toFixed(1)}s
            </span>
          )}
        </div>

        <p className="tape-loop-row__label">{pattern.label}</p>

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
        <div className="tape-loop-row__editor" aria-label={`${pattern.label} editor`}>
          <p className="tape-loop-row__editor-placeholder">
            Sequencer editor coming soon — note grid, instrument selector, and duration dials.
          </p>
        </div>
      ) : null}
    </article>
  )
}
