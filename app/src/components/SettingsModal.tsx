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
  lockMelodyTempo: boolean
  onLockMelodyTempoChange: (value: boolean) => void
  visualLatencyOffsetMs: number
  onVisualLatencyOffsetMsChange: (value: number) => void
  onClose: () => void
}

function formatLatencyMs(sec: number): string {
  return `${Math.round(sec * 1000)} ms`
}

export function SettingsModal({
  open,
  lockMelodyTempo,
  onLockMelodyTempoChange,
  visualLatencyOffsetMs,
  onVisualLatencyOffsetMsChange,
  onClose,
}: SettingsModalProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const lockMelodyTempoSettingId = useId()
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
          <section className="settings-modal__section">
            <h3 className="settings-modal__section-title">appearance</h3>
            <PaletteSelector />
          </section>

          <section className="settings-modal__section">
            <h3 className="settings-modal__section-title">playback</h3>
            <label className="settings-modal__checkbox">
              <input
                id={lockMelodyTempoSettingId}
                type="checkbox"
                checked={lockMelodyTempo}
                onChange={(event) =>
                  onLockMelodyTempoChange(event.target.checked)
                }
              />
              <span className="settings-modal__checkbox-text">
                <span className="settings-modal__checkbox-label">
                  lock melody tempo
                </span>
                <span className="settings-modal__hint">
                  keep melody length when changing tape or pace — for phasing
                  with other loops.
                </span>
              </span>
            </label>
          </section>

          <section className="settings-modal__section">
            <h3 className="settings-modal__section-title">sync</h3>
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
          </section>
        </div>
      </div>
    </div>
  )
}
