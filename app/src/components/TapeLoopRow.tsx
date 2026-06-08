import { useState } from 'react'
import type { LoopPattern, PatternNote } from '../audio/patternTypes'
import { melodyWindowDuration, minLoopDurationForBpm } from '../lib/gridLayout'
import {
  formatDisplayBpm,
  formatDisplayLoopDuration,
  type PaceOptions,
} from '../lib/globalPace'
import { tonalityLabel } from '../lib/scaleSteps'
import type { TapeLoop } from '../audio/tapeLoop'
import { useLoopLevel } from '../hooks/useLoopLevel'
import { useLoopProgress } from '../hooks/useLoopProgress'
import { ConfirmModal } from './ConfirmModal'
import { LoopEditor } from './LoopEditor'
import { LoopLabel } from './LoopLabel'
import { LoopLevelMeter } from './LoopLevelMeter'
import { LoopMenu } from './LoopMenu'
import { LoopVolumeFader } from './LoopVolumeFader'
import { MiniMelodyView } from './MiniMelodyView'
import './LoopEditor.css'
import './LoopLevelMeter.css'
import './LoopVolumeFader.css'
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

function SpeakerIcon() {
  return (
    <svg
      className="tape-loop-row__btn-icon"
      viewBox="0 0 16 16"
      aria-hidden
    >
      <path
        d="M4 6v4h2l3 2V4L6 6H4Z"
        fill="currentColor"
      />
      <path
        d="M10 7a1.5 1.5 0 0 1 0 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M11.5 5.5a3.5 3.5 0 0 1 0 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  )
}

type TapeLoopRowProps = {
  pattern: LoopPattern
  paceOptions: PaceOptions
  playbackLoopDuration: number
  playbackBpm: number
  loop: TapeLoop
  running: boolean
  expanded: boolean
  onRunningChange: (running: boolean) => void
  onExpandedChange: (expanded: boolean) => void
  onNotesChange: (notes: PatternNote[]) => void
  onRootChange: (root: string) => void
  onScaleChange: (scale: string) => void
  onOctaveShiftChange: (octaveShift: number) => void
  onBpmChange: (bpm: number) => void
  onLoopDurationChange: (sec: number) => void
  onLabelChange: (label: string) => void
  onVolumeChange: (volume: number) => void
  onReverbChange: (reverb: number) => void
  onDelayChange: (delay: number) => void
  onInstrumentChange: (instrument: string) => void
  onDuplicate: () => void
  onDelete: () => void
  disabled?: boolean
}

export function TapeLoopRow({
  pattern,
  paceOptions,
  playbackLoopDuration,
  playbackBpm,
  loop,
  running,
  expanded,
  onRunningChange,
  onExpandedChange,
  onNotesChange,
  onRootChange,
  onScaleChange,
  onOctaveShiftChange,
  onBpmChange,
  onLoopDurationChange,
  onLabelChange,
  onVolumeChange,
  onReverbChange,
  onDelayChange,
  onInstrumentChange,
  onDuplicate,
  onDelete,
  disabled = false,
}: TapeLoopRowProps) {
  const [testNonce, setTestNonce] = useState(0)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const { angleDeg, lapFlashKey, loopTimeSec, melodyPlaybackActive, testing } =
    useLoopProgress(loop, running, testNonce)
  const { level, peak } = useLoopLevel(loop, melodyPlaybackActive)
  const melodyWindowSec = melodyWindowDuration(playbackBpm)

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
      <div className="tape-loop-row__header-menu">
        <LoopMenu
          label={pattern.label}
          pattern={pattern}
          disabled={disabled}
          onDuplicate={onDuplicate}
        />
      </div>

      <div className="tape-loop-row__summary reel-lane">
        <div className="reel-lane__controls tape-loop-row__controls">
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
            className={`tape-loop-btn tape-loop-btn--test${testing ? ' is-testing' : ''}`}
            disabled={disabled || running}
            aria-label={`Test ${pattern.label}`}
            onClick={() => {
              loop.test(melodyWindowSec)
              setTestNonce((n) => n + 1)
            }}
          >
            <SpeakerIcon />
          </button>
        </div>

        <div className="reel-lane__level tape-loop-row__level-group">
          <LoopVolumeFader
            value={pattern.volume}
            disabled={disabled}
            onChange={onVolumeChange}
          />
          <LoopLevelMeter level={level} peak={peak} active={melodyPlaybackActive} />
        </div>

        <div className="reel-lane__reel tape-loop-row__reel" aria-hidden>
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
          <span
            className="tape-loop-row__duration-readonly"
            title="cooldown"
          >
            {formatDisplayLoopDuration(playbackLoopDuration)}s
          </span>
        </div>

        <div className="reel-lane__label">
        <LoopLabel
          label={pattern.label}
          disabled={disabled}
          onLabelChange={onLabelChange}
        />
        </div>

        <div className="reel-lane__tape tape-loop-row__tape-content">
          <MiniMelodyView
            pattern={{ ...pattern, bpm: playbackBpm }}
            loopTimeSec={loopTimeSec}
            showPlayhead={melodyPlaybackActive}
          />
          <div className="reel-lane__meta tape-loop-row__content-meta">
            <span title={`BPM: ${formatDisplayBpm(playbackBpm)}`}>
              BPM: {formatDisplayBpm(playbackBpm)}
            </span>
            <span title={`instrument: ${pattern.instrument}`}>
              instrument: {pattern.instrument}
            </span>
            <span
              className="tape-loop-row__meta-scale"
              title={`scale: ${tonalityLabel({ root: pattern.root, scale: pattern.scale })}`}
            >
              scale: {tonalityLabel({ root: pattern.root, scale: pattern.scale })}
            </span>
          </div>
        </div>

        <div className="reel-lane__actions tape-loop-row__actions">
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
            onClick={() => setDeleteConfirmOpen(true)}
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <ConfirmModal
        open={deleteConfirmOpen}
        title="delete reel?"
        message={`This will permanently remove "${pattern.label}".`}
        confirmLabel="delete"
        onConfirm={() => {
          setDeleteConfirmOpen(false)
          onDelete()
        }}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {expanded ? (
        <div className="tape-loop-row__editor">
          <LoopEditor
            pattern={pattern}
            paceOptions={paceOptions}
            playbackLoopDuration={playbackLoopDuration}
            playbackBpm={playbackBpm}
            loopTimeSec={loopTimeSec}
            showPlayhead={melodyPlaybackActive}
            disabled={disabled}
            onNotesChange={onNotesChange}
            onRootChange={onRootChange}
            onScaleChange={onScaleChange}
            onOctaveShiftChange={onOctaveShiftChange}
            onBpmChange={onBpmChange}
            onLoopDurationChange={handleLoopDurationChange}
            onReverbChange={onReverbChange}
            onDelayChange={onDelayChange}
            onInstrumentChange={onInstrumentChange}
          />
        </div>
      ) : null}
    </article>
  )
}
