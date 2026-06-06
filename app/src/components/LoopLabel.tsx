import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const MAX_FONT_PX = 10
const MIN_FONT_PX = 6

type LoopLabelProps = {
  label: string
  disabled?: boolean
  onLabelChange: (label: string) => void
}

export function LoopLabel({
  label,
  disabled = false,
  onLabelChange,
}: LoopLabelProps) {
  const containerRef = useRef<HTMLParagraphElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label)

  useEffect(() => {
    if (!editing) {
      setDraft(label)
    }
  }, [label, editing])

  useLayoutEffect(() => {
    if (editing) {
      return
    }

    const container = containerRef.current
    const text = textRef.current
    if (!container || !text) {
      return
    }

    let size = MAX_FONT_PX
    text.style.fontSize = `${size}px`

    while (size > MIN_FONT_PX && text.scrollWidth > container.clientWidth) {
      size -= 0.5
      text.style.fontSize = `${size}px`
    }
  }, [label, editing])

  useEffect(() => {
    if (!editing) {
      return
    }

    const input = inputRef.current
    if (!input) {
      return
    }

    input.focus()
    input.select()
  }, [editing])

  function commit() {
    const next = draft.trim()
    if (next && next !== label) {
      onLabelChange(next)
    }
    setDraft(label)
    setEditing(false)
  }

  function cancel() {
    setDraft(label)
    setEditing(false)
  }

  if (editing) {
    return (
      <p className="tape-loop-row__label tape-loop-row__label--editing">
        <input
          ref={inputRef}
          className="tape-loop-row__label-input"
          value={draft}
          aria-label="Loop name"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commit()
            } else if (event.key === 'Escape') {
              event.preventDefault()
              cancel()
            }
          }}
        />
      </p>
    )
  }

  return (
    <p ref={containerRef} className="tape-loop-row__label" title={label}>
      <button
        type="button"
        className="tape-loop-row__label-button"
        disabled={disabled}
        aria-label={`Rename ${label}`}
        onClick={() => {
          if (!disabled) {
            setEditing(true)
          }
        }}
      >
        <span ref={textRef} className="tape-loop-row__label-text">
          {label}
        </span>
      </button>
    </p>
  )
}
