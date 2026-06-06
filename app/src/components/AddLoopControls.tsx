import { useEffect, useId, useRef, useState } from 'react'
import { LOOP_PRESETS, type LoopPresetId } from '../audio/demoPatterns'
import './AddLoopControls.css'

type AddLoopControlsProps = {
  onAddBlank: () => void
  onAddPreset: (presetId: LoopPresetId) => void
}

export function AddLoopControls({ onAddBlank, onAddPreset }: AddLoopControlsProps) {
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

  return (
    <div className="loop-stack__add-row">
      <button
        type="button"
        className="loop-stack__add"
        aria-label="Add blank loop"
        onClick={onAddBlank}
      >
        +
      </button>

      <div className="add-loop-presets" ref={rootRef}>
        <button
          type="button"
          className={`add-loop-presets__trigger${open ? ' is-open' : ''}`}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((prev) => !prev)}
        >
          presets
          <span className="add-loop-presets__caret" aria-hidden>
            ▾
          </span>
        </button>

        {open ? (
          <div id={menuId} className="add-loop-presets__menu" role="menu">
            {LOOP_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="add-loop-presets__item"
                role="menuitem"
                onClick={() => {
                  onAddPreset(preset.id)
                  setOpen(false)
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
