import { useEffect, useId, useRef, useState } from 'react'
import './LoopMenu.css'

function DotsIcon() {
  return (
    <svg className="loop-menu__icon" viewBox="0 0 16 16" aria-hidden>
      <circle cx="3" cy="8" r="1.25" fill="currentColor" />
      <circle cx="8" cy="8" r="1.25" fill="currentColor" />
      <circle cx="13" cy="8" r="1.25" fill="currentColor" />
    </svg>
  )
}

type LoopMenuProps = {
  label: string
  disabled?: boolean
  onDuplicate: () => void
}

export function LoopMenu({ label, disabled = false, onDuplicate }: LoopMenuProps) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function close() {
    setOpen(false)
  }

  return (
    <div className="loop-menu" ref={rootRef}>
      <button
        type="button"
        className={`loop-menu__trigger${open ? ' is-open' : ''}`}
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
        <div id={menuId} className="loop-menu__dropdown" role="menu">
          <button
            type="button"
            className="loop-menu__item"
            role="menuitem"
            onClick={() => {
              onDuplicate()
              close()
            }}
          >
            duplicate
          </button>
          <button
            type="button"
            className="loop-menu__item"
            role="menuitem"
            disabled
            title="Coming soon"
          >
            export
          </button>
        </div>
      ) : null}
    </div>
  )
}
