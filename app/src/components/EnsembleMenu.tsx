import { useEffect, useId, useRef, useState } from 'react'
import { useDismissable } from '../hooks/useDismissable'
import { copyTextToClipboard } from '../lib/clipboard'
import { serializeEnsemble } from '../lib/ensembleStorage'
import './EnsembleMenu.css'

function DotsIcon() {
  return (
    <svg className="ensemble-menu__icon" viewBox="0 0 16 16" aria-hidden>
      <circle cx="3" cy="8" r="1.25" fill="currentColor" />
      <circle cx="8" cy="8" r="1.25" fill="currentColor" />
      <circle cx="13" cy="8" r="1.25" fill="currentColor" />
    </svg>
  )
}

type EnsembleMenuProps = {
  ensembleId: string
  label: string
  disabled?: boolean
  onRename: () => void
  onDelete: () => void
}

export function EnsembleMenu({
  ensembleId,
  label,
  disabled = false,
  onRename,
  onDelete,
}: EnsembleMenuProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useDismissable(open, () => setOpen(false), rootRef)

  useEffect(() => {
    if (!copied) {
      return
    }

    const timeout = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timeout)
  }, [copied])

  function close() {
    setOpen(false)
  }

  async function handleExportJson() {
    const json = serializeEnsemble(ensembleId)
    if (!json) {
      close()
      return
    }

    const ok = await copyTextToClipboard(json)
    if (!ok) {
      close()
      return
    }

    setCopied(true)
    window.setTimeout(() => {
      setCopied(false)
      close()
    }, 1200)
  }

  return (
    <div className="ensemble-menu" ref={rootRef}>
      <button
        type="button"
        className={`ensemble-menu__trigger${open ? ' is-open' : ''}`}
        disabled={disabled}
        aria-label={`${label} options`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <DotsIcon />
      </button>

      {open ? (
        <div id={menuId} className="ensemble-menu__dropdown" role="menu">
          <button
            type="button"
            className="ensemble-menu__item"
            role="menuitem"
            onClick={() => {
              onRename()
              close()
            }}
          >
            rename
          </button>
          <button
            type="button"
            className="ensemble-menu__item"
            role="menuitem"
            onClick={() => {
              void handleExportJson()
            }}
          >
            {copied ? 'copied' : 'export JSON'}
          </button>
          <button
            type="button"
            className="ensemble-menu__item ensemble-menu__item--danger"
            role="menuitem"
            onClick={() => {
              onDelete()
              close()
            }}
          >
            delete
          </button>
        </div>
      ) : null}
    </div>
  )
}
