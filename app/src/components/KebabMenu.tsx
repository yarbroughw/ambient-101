import { useId, useRef, useState } from 'react'
import { useDismissable } from '../hooks/useDismissable'

function DotsIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden>
      <circle cx="3" cy="8" r="1.25" fill="currentColor" />
      <circle cx="8" cy="8" r="1.25" fill="currentColor" />
      <circle cx="13" cy="8" r="1.25" fill="currentColor" />
    </svg>
  )
}

export type KebabMenuItem = {
  key: string
  label: string
  onClick: (close: () => void) => void
  danger?: boolean
}

type KebabMenuProps = {
  label: string
  className: string
  disabled?: boolean
  items: KebabMenuItem[]
}

export function KebabMenu({
  label,
  className,
  disabled = false,
  items,
}: KebabMenuProps) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useDismissable(open, () => setOpen(false), rootRef)

  function close() {
    setOpen(false)
  }

  return (
    <div className={className} ref={rootRef}>
      <button
        type="button"
        className={`${className}__trigger${open ? ' is-open' : ''}`}
        disabled={disabled}
        aria-label={`${label} options`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <DotsIcon className={`${className}__icon`} />
      </button>

      {open ? (
        <div id={menuId} className={`${className}__dropdown`} role="menu">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              className={
                item.danger
                  ? `${className}__item ${className}__item--danger`
                  : `${className}__item`
              }
              role="menuitem"
              onClick={() => item.onClick(close)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
