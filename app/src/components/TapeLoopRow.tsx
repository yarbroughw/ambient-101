import { useEffect, useRef, useState } from 'react'
import type { LoopPattern, PatternNote } from '../audio/patternTypes'
import { melodyWindowDuration } from '../lib/gridLayout'
import {
  formatDisplayBpm,
  formatDisplayLoopDuration,
  type PaceOptions,
} from '../lib/globalPace'
import { tonalityLabel } from '../lib/scaleSteps'
import type { TapeLoop } from '../audio/tapeLoop'
import { ensureAudioStarted } from '../audio/audioSession'
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

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? 'tape-loop-row__btn-icon'}
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
  onLoopTimingChange: (loopDurationMs: number, bpm: number) => void
  onLabelChange: (label: string) => void
  onVolumeChange: (volume: number) => void
  onReverbChange: (reverb: number) => void
  onDelayChange: (delay: number) => void
  onInstrumentChange: (instrument: string) => void
  onCutoffChange: (hz: number) => void
  onResonanceChange: (q: number) => void
  onChorusChange: (amount: number) => void
  onAttackChange: (attack: number) => void
  onReleaseChange: (release: number) => void
  onLoopColsChange: (loopCols: number) => void
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
  onLoopTimingChange,
  onLabelChange,
  onVolumeChange,
  onReverbChange,
  onDelayChange,
  onInstrumentChange,
  onCutoffChange,
  onResonanceChange,
  onChorusChange,
  onAttackChange,
  onReleaseChange,
  onLoopColsChange,
  onDuplicate,
  onDelete,
  disabled = false,
}: TapeLoopRowProps) {
  const [testNonce, setTestNonce] = useState(0)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const { angleDeg, lapFlashKey, loopTimeSec, melodyPlaybackActive, testing } =
    useLoopProgress(loop, running, testNonce)
  const { level, peak } = useLoopLevel(loop, melodyPlaybackActive)
  const melodyWindowSec = melodyWindowDuration(playbackBpm, pattern.loopCols)
  const fillRatio =
    playbackLoopDuration > 0
      ? Math.min(1, melodyWindowSec / playbackLoopDuration)
      : 1
  // The melody only sounds over the first `fillRatio` of each rotation; the
  // remainder is the silent cooldown tail.
  const melodySounding = running && loopTimeSec < melodyWindowSec

  // Flash the row border / reel dot on each lap — but skip the flash on
  // (re)mount (e.g. toggling to the timeline view and back). `lapFlashKey`
  // resets to 0 on mount and only increments on real laps.
  const articleRef = useRef<HTMLElement>(null)
  const showLap = running && lapFlashKey > 0
  useEffect(() => {
    if (!running || lapFlashKey === 0) {
      return
    }
    const el = articleRef.current
    if (!el) {
      return
    }
    // Restart the CSS animation by removing, forcing reflow, then re-adding.
    el.classList.remove('tape-loop-row--lap')
    void el.offsetWidth
    el.classList.add('tape-loop-row--lap')
  }, [lapFlashKey, running])

  return (
    <article
      ref={articleRef}
      id={`reel-${pattern.id}`}
      className={`tape-loop-row${expanded ? ' is-expanded' : ''}${running ? ' is-running' : ''}`}
      aria-label={pattern.label}
    >
      <div className="tape-loop-row__summary reel-lane">
        <div className="reel-lane__controls tape-loop-row__controls">
          <div className="tape-loop-row__transport">
            <button
              type="button"
              className="tape-loop-btn tape-loop-btn--play"
              disabled={disabled || running}
              aria-label={`Play ${pattern.label}`}
              onClick={() => {
                void ensureAudioStarted().then(() => {
                  loop.start()
                  onRunningChange(true)
                })
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
          </div>
          <div className="tape-loop-row__level-group">
            <LoopVolumeFader
              value={pattern.volume}
              disabled={disabled}
              onChange={onVolumeChange}
            />
            <LoopLevelMeter level={level} peak={peak} active={melodyPlaybackActive} />
          </div>
        </div>

        <div className="tape-loop-row__center">
          <div className="reel-lane__label">
            <LoopLabel
              label={pattern.label}
              disabled={disabled}
              onLabelChange={onLabelChange}
            />
          </div>

          <div className="reel-lane__reel tape-loop-row__reel" aria-hidden>
            <div className="tape-loop-row__ring" />
            <svg
              className="tape-loop-row__arc"
              viewBox="0 0 44 44"
              aria-hidden
            >
              <circle
                className="tape-loop-row__arc-fill"
                cx="22"
                cy="22"
                r="21"
                fill="none"
                strokeWidth="2"
                pathLength={1}
                strokeDasharray={`${fillRatio} ${Math.max(0, 1 - fillRatio)}`}
                transform="rotate(-90 22 22)"
              />
            </svg>
            <div className="tape-loop-row__tick" />
            {running ? (
              <div
                className="tape-loop-row__dot"
                style={{ transform: `rotate(${angleDeg}deg)` }}
              >
                <span
                  key={lapFlashKey}
                  className={`tape-loop-row__dot-head${showLap ? ' tape-loop-row__dot-head--lap' : ''}${melodySounding ? ' is-sounding' : ''}`}
                />
              </div>
            ) : null}
            <span
              className="tape-loop-row__duration-readonly"
              title="tape length"
            >
              {formatDisplayLoopDuration(playbackLoopDuration)}s
            </span>
          </div>

          <div className="tape-loop-row__melody-wrap">
            <MiniMelodyView
              pattern={{ ...pattern, bpm: playbackBpm }}
              loopTimeSec={loopTimeSec}
              showPlayhead={melodyPlaybackActive}
              flashNotes={melodyPlaybackActive}
              periodSec={playbackLoopDuration}
            />
            <button
              type="button"
              className={`mini-melody__test-btn${testing ? ' is-testing' : ''}`}
              disabled={disabled || running}
              aria-label={`Test ${pattern.label}`}
              onClick={() => {
                void ensureAudioStarted().then(() => {
                  loop.test(melodyWindowSec)
                  setTestNonce((n) => n + 1)
                })
              }}
            >
              <SpeakerIcon className="mini-melody__test-icon" />
            </button>
          </div>
        </div>

        <div className="reel-lane__tape tape-loop-row__tape-content">
          <div className="reel-lane__meta tape-loop-row__content-meta">
            <span title={`melody window · BPM ${formatDisplayBpm(playbackBpm)}`}>
              melody: {melodyWindowSec.toFixed(1)}s
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
          <LoopMenu
            label={pattern.label}
            pattern={pattern}
            disabled={disabled}
            onDuplicate={onDuplicate}
            onDelete={() => setDeleteConfirmOpen(true)}
          />
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
            onLoopTimingChange={onLoopTimingChange}
            onReverbChange={onReverbChange}
            onDelayChange={onDelayChange}
            onInstrumentChange={onInstrumentChange}
            onCutoffChange={onCutoffChange}
            onResonanceChange={onResonanceChange}
            onChorusChange={onChorusChange}
            onAttackChange={onAttackChange}
            onReleaseChange={onReleaseChange}
            onLoopColsChange={onLoopColsChange}
          />
        </div>
      ) : null}
    </article>
  )
}
