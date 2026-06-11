import { useEffect, useRef, useState } from 'react'
import './Dial.css'

type DialProps = {
  label: string
  /** Secondary line under the label for derived values (e.g. fill → seconds). */
  subLabel?: string
  ariaLabel?: string
  value: number
  min?: number
  max?: number
  /**
   * Interactive lower bound inside [min, max]. The arc below it is greyed
   * (forbidden) with a notch at the boundary; drags clamp to it. Used for
   * ranges whose floor shifts with another control (e.g. fill min vs cooldown).
   */
  softMin?: number
  step?: number
  size?: number
  disabled?: boolean
  className?: string
  formatReadout?: (value: number) => string
  /** Click the center readout to type a value; snaps to `readoutStep` on commit. */
  editableReadout?: boolean
  /** Snap increment when committing a typed readout; defaults to `step`. */
  readoutStep?: number
  parseReadoutInput?: (text: string) => number | null
  onChange: (value: number) => void
}

const SWEEP_DEG = 270
const START_DEG = 225
const TOOLBAR_DIAL_SIZE = 70

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
  const parsed = Number.parseFloat(text.trim().replace(/s$/i, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  }
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

export function Dial({
  label,
  subLabel,
  ariaLabel,
  value,
  min = 0,
  max = 1,
  softMin,
  step = 0.01,
  size = 32,
  disabled = false,
  className = '',
  formatReadout,
  editableReadout = false,
  readoutStep,
  parseReadoutInput = defaultParseReadoutInput,
  onChange,
}: DialProps) {
  const dragRef = useRef<{
    y: number
    value: number
    moved: boolean
    fromReadout: boolean
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [editingReadout, setEditingReadout] = useState(false)
  const [readoutDraft, setReadoutDraft] = useState('')
  const isToolbar = className.includes('dial--toolbar')
  const visualSize = isToolbar ? TOOLBAR_DIAL_SIZE : size

  const lowerBound = softMin != null ? Math.min(max, Math.max(min, softMin)) : min
  const ratio = (value - min) / (max - min)
  const valueAngle = START_DEG + ratio * SWEEP_DEG
  const lowerRatio = (lowerBound - min) / (max - min)
  const lowerAngle = START_DEG + lowerRatio * SWEEP_DEG
  const stroke = visualSize >= 40 ? 3.5 : 3
  const radius = (visualSize - stroke) / 2
  const center = visualSize / 2
  const trackPath = describeArc(center, center, radius, START_DEG, START_DEG + SWEEP_DEG)
  const valueStartAngle = softMin != null ? lowerAngle : START_DEG
  const valuePath =
    valueAngle > valueStartAngle
      ? describeArc(center, center, radius, valueStartAngle, valueAngle)
      : ''
  const inactivePath =
    softMin != null && lowerRatio > 0.001
      ? describeArc(center, center, radius, START_DEG, lowerAngle)
      : ''
  const notchInner = polarToCartesian(center, center, radius - stroke, lowerAngle)
  const notchOuter = polarToCartesian(center, center, radius + stroke * 0.6, lowerAngle)

  function updateFromPointer(clientY: number, originY: number, originValue: number) {
    const delta = (originY - clientY) * 0.006 * (max - min)
    onChange(snap(originValue + delta, step, lowerBound, max))
  }

  const readoutText = formatReadout ? formatReadout(value) : String(Math.round(ratio * 100))

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

  useEffect(() => {
    if (!editingReadout) {
      setReadoutDraft(readoutText)
    }
  }, [readoutText, editingReadout])

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

  return (
    <div
      className={`dial${disabled ? ' dial--disabled' : ''}${visualSize >= 40 ? ' dial--lg' : ''}${className ? ` ${className}` : ''}`}
      style={
        className.includes('dial--toolbar')
          ? undefined
          : { ['--dial-size' as string]: `${size}px` }
      }
    >
      <div
        className="dial__control"
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
          // Drags may start on the readout too; a click there (no movement)
          // opens the type-in editor on pointer up instead.
          dragRef.current = {
            y: e.clientY,
            value,
            moved: false,
            fromReadout:
              (e.target as HTMLElement).closest('.dial__readout') != null,
          }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          const drag = dragRef.current
          if (!drag || disabled) {
            return
          }
          if (!drag.moved && Math.abs(e.clientY - drag.y) <= 2) {
            return
          }
          drag.moved = true
          updateFromPointer(e.clientY, drag.y, drag.value)
        }}
        onPointerUp={() => {
          const drag = dragRef.current
          dragRef.current = null
          if (drag && !drag.moved && drag.fromReadout) {
            beginReadoutEdit()
          }
        }}
        onPointerCancel={() => {
          dragRef.current = null
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
        <svg
          className="dial__svg"
          width={isToolbar ? '100%' : visualSize}
          height={isToolbar ? '100%' : visualSize}
          viewBox={`0 0 ${visualSize} ${visualSize}`}
          aria-hidden
        >
          <path
            className="dial__track"
            d={trackPath}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {inactivePath ? (
            <path
              className="dial__inactive"
              d={inactivePath}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          ) : null}
          {valuePath ? (
            <path
              className="dial__value"
              d={valuePath}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          ) : null}
          {inactivePath ? (
            <line
              className="dial__notch"
              x1={notchInner.x}
              y1={notchInner.y}
              x2={notchOuter.x}
              y2={notchOuter.y}
              strokeWidth={1.25}
              strokeLinecap="round"
            />
          ) : null}
        </svg>
        {editableReadout && editingReadout ? (
          <input
            ref={inputRef}
            className="dial__readout-input"
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
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`dial__readout${editableReadout ? ' dial__readout--editable' : ''}`}
          >
            {readoutText}
          </span>
        )}
      </div>
      <span className="dial__label">{label}</span>
      {subLabel ? <span className="dial__sublabel">{subLabel}</span> : null}
    </div>
  )
}
