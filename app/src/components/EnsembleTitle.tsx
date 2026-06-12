import { useEffect, useRef, useState } from 'react'
import './EnsembleTitle.css'

type EnsembleTitleProps = {
  name: string
  onRename: (name: string) => void
}

/** Editable ensemble name beside the back chevron — reads as a breadcrumb. */
export function EnsembleTitle({ name, onRename }: EnsembleTitleProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)

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
    if (next && next !== name) {
      onRename(next)
    }
    setDraft(name)
    setEditing(false)
  }

  function cancel() {
    setDraft(name)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="ensemble-title__input"
        value={draft}
        aria-label="Ensemble name"
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
    )
  }

  return (
    <button
      type="button"
      className="ensemble-title"
      title={`Rename ${name}`}
      onClick={() => { setDraft(name); setEditing(true) }}
    >
      {name}
    </button>
  )
}
