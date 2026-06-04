import { useState } from 'react'
import { useLoopReelVisuals } from '../hooks/useLoopReelVisuals'
import type { TapeLoop } from '../audio/tapeLoop'

type TapeLoopCardProps = {
  loop: TapeLoop
  running: boolean
  onRunningChange: (running: boolean) => void
  disabled?: boolean
}

export function TapeLoopCard({
  loop,
  running,
  onRunningChange,
  disabled = false,
}: TapeLoopCardProps) {
  const [duration, setDuration] = useState(loop.duration)
  const [editingLength, setEditingLength] = useState(false)
  const { angleDeg, lapFlashKey } = useLoopReelVisuals(loop, running)

  return (
    <article className="tape-loop-card" aria-label={loop.label}>
      <div
        className={`tape-loop-card__panel${running ? ' is-running' : ''}`}
      >
        <p className="tape-loop-card__label">{loop.label}</p>

        <div className="tape-loop-card__reel" aria-hidden>
          <div className="tape-loop-card__ring" />
          <div className="tape-loop-card__tick" />
          {running ? (
            <div
              className="tape-loop-card__dot"
              style={{ transform: `rotate(${angleDeg}deg)` }}
            >
              <span
                key={lapFlashKey}
                className="tape-loop-card__dot-head tape-loop-card__dot-head--lap"
              />
            </div>
          ) : null}
          {editingLength ? (
            <input
              className="tape-loop-card__duration-input"
              type="number"
              min={2}
              max={60}
              step={0.5}
              value={duration}
              disabled={disabled}
              autoFocus
              aria-label={`${loop.label} loop length in seconds`}
              onBlur={() => setEditingLength(false)}
              onChange={(e) => {
                const next = Number(e.target.value)
                if (!Number.isFinite(next)) {
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
          ) : (
            <button
              type="button"
              className="tape-loop-card__duration"
              disabled={disabled}
              title="Click to edit loop length"
              onClick={() => setEditingLength(true)}
            >
              {duration.toFixed(1)}s
            </button>
          )}
        </div>

        <div className="tape-loop-card__controls">
          <button
            type="button"
            className="tape-loop-btn tape-loop-btn--play"
            disabled={disabled || running}
            aria-label={`Play ${loop.label}`}
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
            aria-label={`Stop ${loop.label}`}
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
            aria-label={`Test ${loop.label}`}
            onClick={() => loop.test()}
          >
            ↺
          </button>
        </div>
      </div>
    </article>
  )
}
