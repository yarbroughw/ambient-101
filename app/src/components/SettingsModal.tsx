import { useEffect, useId, useRef } from 'react'
import { PaletteSelector } from './PaletteSelector'
import './SettingsModal.css'

type SettingsModalProps = {
  open: boolean
  paceAffectsMelody: boolean
  onPaceAffectsMelodyChange: (value: boolean) => void
  onClose: () => void
}

export function SettingsModal({
  open,
  paceAffectsMelody,
  onPaceAffectsMelodyChange,
  onClose,
}: SettingsModalProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const paceSettingId = useId()

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
        </div>
      </div>
    </div>
  )
}
