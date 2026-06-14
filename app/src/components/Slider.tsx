import { useEffect, useRef, useState } from 'react'
import './Slider.css'

type SliderProps = {
  label: string
  /** Secondary line under the track for derived values (e.g. fill → seconds). */
  subLabel?: string
  ariaLabel?: string
  value: number
  min?: number
  max?: number
  /**
   * Interactive lower bound inside [min, max]. The track below it is greyed
   * (forbidden) with a notch at the boundary; drags clamp to it. Mirrors the
   * Dial softMin so a control can switch between rotary and linear freely.
   */
  softMin?: number
  step?: number
  disabled?: boolean
  formatReadout?: (value: number) => string
  /** Click the readout to type a value; snaps to `readoutStep` on commit. */
  editableReadout?: boolean
  readoutStep?: number
  parseReadoutInput?: (text: string) => number | null
  onChange: (value: number) => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function snap(value: number, step: number, min: number, max: number): number {
  const precision = Math.max(0, -Math.floor(Math.log10(step)))
  const scale = 10 ** precision
  const snapped = (Math.round((value * scale) / (step * scale)) * (step * scale)) / scale
  return clamp(snapped, min, max)
}

function defaultParseReadoutInput(text: string): number | null {
  const parsed = Number.parseFloat(text.trim())
  return Number.isFinite(parsed) ? parsed : null
}

export function Slider({
  label,
  subLabel,
  ariaLabel,
  value,
  min = 0,
  max = 1,
  softMin,
  step = 0.01,
  disabled = false,
  formatReadout,
  editableReadout = false,
  readoutStep,
  parseReadoutInput = defaultParseReadoutInput,
  onChange,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const draggingRef = useRef(false)
  const [editingReadout, setEditingReadout] = useState(false)
  const [readoutDraft, setReadoutDraft] = useState('')

  const lowerBound = softMin != null ? clamp(softMin, min, max) : min
  const valueRatio = clamp((value - min) / (max - min), 0, 1)
  const lowerRatio = clamp((lowerBound - min) / (max - min), 0, 1)

  const readoutText = formatReadout
    ? formatReadout(value)
    : String(Math.round(valueRatio * 100))

  useEffect(() => {
    if (!editingReadout) {
      return
    }
    const input = inputRef.current
    if (!input) {
      return
    }
    input.focus()
    input.select()
  }, [editingReadout])

  function valueFromClientX(clientX: number): number {
    const el = trackRef.current
    if (!el) {
      return value
    }
    const rect = el.getBoundingClientRect()
    const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0
    return snap(min + ratio * (max - min), step, lowerBound, max)
  }

  function beginReadoutEdit() {
    if (disabled || !editableReadout || editingReadout) {
      return
    }
    setReadoutDraft(readoutText)
    setEditingReadout(true)
  }

  function cancelReadoutEdit() {
    setReadoutDraft(readoutText)
    setEditingReadout(false)
  }

  function commitReadoutEdit() {
    const parsed = parseReadoutInput(readoutDraft)
    if (parsed == null) {
      cancelReadoutEdit()
      return
    }
    onChange(snap(parsed, readoutStep ?? step, lowerBound, max))
    setEditingReadout(false)
  }

  const readoutControl =
    editableReadout && editingReadout ? (
      <input
        ref={inputRef}
        className="slider__readout-input"
        type="text"
        inputMode="decimal"
        value={readoutDraft}
        aria-label={`${ariaLabel ?? label} value`}
        onChange={(e) => setReadoutDraft(e.target.value)}
        onBlur={commitReadoutEdit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commitReadoutEdit()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            cancelReadoutEdit()
          }
        }}
      />
    ) : (
      <button
        type="button"
        className={`slider__readout${editableReadout ? ' slider__readout--editable' : ''}`}
        disabled={disabled || !editableReadout}
        onClick={beginReadoutEdit}
      >
        {readoutText}
      </button>
    )

  return (
    <div className={`slider${disabled ? ' slider--disabled' : ''}`}>
      <div className="slider__header">
        <span className="slider__label">{label}</span>
        {readoutControl}
      </div>
      <div className="slider__row">
        <div
          ref={trackRef}
          className="slider__track"
          role="slider"
          aria-label={ariaLabel ?? label}
          aria-valuemin={lowerBound}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onPointerDown={(e) => {
            if (disabled || editingReadout) {
              return
            }
            e.preventDefault()
            draggingRef.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            onChange(valueFromClientX(e.clientX))
          }}
          onPointerMove={(e) => {
            if (!draggingRef.current || disabled) {
              return
            }
            onChange(valueFromClientX(e.clientX))
          }}
          onPointerUp={() => {
            draggingRef.current = false
          }}
          onPointerCancel={() => {
            draggingRef.current = false
          }}
          onKeyDown={(e) => {
            if (disabled) {
              return
            }
            if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
              e.preventDefault()
              onChange(snap(value + step, step, lowerBound, max))
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
              e.preventDefault()
              onChange(snap(value - step, step, lowerBound, max))
            }
          }}
          onWheel={(e) => {
            if (disabled) {
              return
            }
            e.preventDefault()
            const delta = e.deltaY > 0 ? -step * 4 : step * 4
            onChange(snap(value + delta, step, lowerBound, max))
          }}
        >
          <div className="slider__rail" aria-hidden />
          {lowerRatio > 0.001 ? (
            <div
              className="slider__inactive"
              style={{ width: `${lowerRatio * 100}%` }}
              aria-hidden
            />
          ) : null}
          <div
            className="slider__fill"
            style={{
              left: `${lowerRatio * 100}%`,
              width: `${Math.max(0, valueRatio - lowerRatio) * 100}%`,
            }}
            aria-hidden
          />
          {lowerRatio > 0.001 ? (
            <div
              className="slider__notch"
              style={{ left: `${lowerRatio * 100}%` }}
              aria-hidden
            />
          ) : null}
          <div
            className="slider__thumb"
            style={{ left: `${valueRatio * 100}%` }}
            aria-hidden
          />
        </div>
      </div>
      {subLabel ? <span className="slider__sublabel">{subLabel}</span> : null}
    </div>
  )
}
