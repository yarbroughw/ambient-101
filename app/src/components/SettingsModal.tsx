import { useEffect, useId, useRef } from 'react'
import { getOutputLatencySec, getTotalVisualLatencySec } from '../audio/outputLatency'
import {
  formatVisualLatencyOffsetMs,
  VISUAL_LATENCY_OFFSET_MS_MAX,
  VISUAL_LATENCY_OFFSET_MS_MIN,
  VISUAL_LATENCY_OFFSET_MS_STEP,
} from '../lib/visualLatencySettings'
import { PaletteSelector } from './PaletteSelector'
import './SettingsModal.css'

type SettingsModalProps = {
  open: boolean
  paceAffectsMelody: boolean
  onPaceAffectsMelodyChange: (value: boolean) => void
  visualLatencyOffsetMs: number
  onVisualLatencyOffsetMsChange: (value: number) => void
  onClose: () => void
}

function formatLatencyMs(sec: number): string {
  return `${Math.round(sec * 1000)} ms`
}

export function SettingsModal({
  open,
  paceAffectsMelody,
  onPaceAffectsMelodyChange,
  visualLatencyOffsetMs,
  onVisualLatencyOffsetMsChange,
  onClose,
}: SettingsModalProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const paceSettingId = useId()
  const visualLatencySettingId = useId()
  const deviceLatencySec = open ? getOutputLatencySec() : 0
  const totalLatencySec = open ? getTotalVisualLatencySec() : 0

  useEffect(() => {
    if (!open) {
      return
    }

    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="settings-modal" role="presentation" onClick={onClose}>
      <div
        className="settings-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-modal__header">
          <h2 id={titleId} className="settings-modal__title">
            settings
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="settings-modal__close"
            aria-label="Close settings"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="settings-modal__body">
          <PaletteSelector />
          <label className="settings-modal__checkbox">
            <input
              id={paceSettingId}
              type="checkbox"
              checked={paceAffectsMelody}
              onChange={(event) => onPaceAffectsMelodyChange(event.target.checked)}
            />
            <span>pace affects melody tempo</span>
          </label>
          <div className="settings-modal__field">
            <div className="settings-modal__field-header">
              <label
                htmlFor={visualLatencySettingId}
                className="settings-modal__field-label"
              >
                visual sync offset
              </label>
              <span className="settings-modal__field-value">
                {formatVisualLatencyOffsetMs(visualLatencyOffsetMs)}
              </span>
            </div>
            <input
              id={visualLatencySettingId}
              className="settings-modal__range"
              type="range"
              min={VISUAL_LATENCY_OFFSET_MS_MIN}
              max={VISUAL_LATENCY_OFFSET_MS_MAX}
              step={VISUAL_LATENCY_OFFSET_MS_STEP}
              value={visualLatencyOffsetMs}
              onChange={(event) =>
                onVisualLatencyOffsetMsChange(Number(event.target.value))
              }
            />
            <p className="settings-modal__hint">
              delay playheads to match what you hear. device reports{' '}
              {formatLatencyMs(deviceLatencySec)}; total compensation{' '}
              {formatLatencyMs(totalLatencySec)}.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
