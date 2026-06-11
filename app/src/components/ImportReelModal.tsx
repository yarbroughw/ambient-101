import { useEffect, useId, useRef, useState } from 'react'
import './ImportReelModal.css'

export type ImportReelResult =
  | { ok: true; count: number }
  | { ok: false; message: string }

type ImportReelModalProps = {
  open: boolean
  onImport: (raw: string) => ImportReelResult
  onClose: () => void
  title?: string
  description?: string
  textareaLabel?: string
}

export function ImportReelModal({
  open,
  onImport,
  onClose,
  title = 'import reel',
  description = 'Paste JSON for one reel, or a list of reels from copy JSON.',
  textareaLabel = 'reel JSON',
}: ImportReelModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const textareaId = useId()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setValue('')
    setError(null)
    textareaRef.current?.focus()

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

  function handleImport() {
    const result = onImport(value.trim())
    if (!result.ok) {
      setError(result.message)
      return
    }

    onClose()
  }

  return (
    <div className="import-reel-modal" role="presentation" onClick={onClose}>
      <div
        className="import-reel-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="import-reel-modal__title">
          {title}
        </h2>
        <p id={descriptionId} className="import-reel-modal__description">
          {description}
        </p>
        <label className="import-reel-modal__label" htmlFor={textareaId}>
          {textareaLabel}
        </label>
        <textarea
          ref={textareaRef}
          id={textareaId}
          className="import-reel-modal__textarea"
          value={value}
          rows={8}
          spellCheck={false}
          onChange={(event) => {
            setValue(event.target.value)
            if (error) {
              setError(null)
            }
          }}
        />
        {error ? <p className="import-reel-modal__error">{error}</p> : null}
        <div className="import-reel-modal__actions">
          <button
            type="button"
            className="import-reel-modal__btn import-reel-modal__btn--cancel"
            onClick={onClose}
          >
            cancel
          </button>
          <button
            type="button"
            className="import-reel-modal__btn import-reel-modal__btn--import"
            onClick={handleImport}
          >
            import
          </button>
        </div>
      </div>
    </div>
  )
}
