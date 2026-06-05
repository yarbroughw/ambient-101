import { useRef } from 'react'
import './Dial.css'

type DialProps = {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  onChange: (value: number) => void
}

const SWEEP_DEG = 270
const START_DEG = 225

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function snap(value: number, step: number, min: number, max: number): number {
  const snapped = Math.round(value / step) * step
  return clamp(snapped, min, max)
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
  value,
  min = 0,
  max = 1,
  step = 0.01,
  disabled = false,
  onChange,
}: DialProps) {
  const dragRef = useRef<{ y: number; value: number } | null>(null)

  const ratio = (value - min) / (max - min)
  const valueAngle = START_DEG + ratio * SWEEP_DEG
  const size = 32
  const stroke = 3
  const radius = (size - stroke) / 2
  const center = size / 2
  const trackPath = describeArc(center, center, radius, START_DEG, START_DEG + SWEEP_DEG)
  const valuePath =
    ratio > 0 ? describeArc(center, center, radius, START_DEG, valueAngle) : ''

  function updateFromPointer(clientY: number, originY: number, originValue: number) {
    const delta = (originY - clientY) * 0.006 * (max - min)
    onChange(snap(originValue + delta, step, min, max))
  }

  return (
    <div className={`dial${disabled ? ' dial--disabled' : ''}`}>
      <div
        className="dial__control"
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={(e) => {
          if (disabled) {
            return
          }
          e.currentTarget.setPointerCapture(e.pointerId)
          dragRef.current = { y: e.clientY, value }
        }}
        onPointerMove={(e) => {
          if (!dragRef.current || disabled) {
            return
          }
          updateFromPointer(e.clientY, dragRef.current.y, dragRef.current.value)
        }}
        onPointerUp={() => {
          dragRef.current = null
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
            onChange(snap(value + step, step, min, max))
          }
          if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
            e.preventDefault()
            onChange(snap(value - step, step, min, max))
          }
        }}
        onWheel={(e) => {
          if (disabled) {
            return
          }
          e.preventDefault()
          const delta = e.deltaY > 0 ? -step * 4 : step * 4
          onChange(snap(value + delta, step, min, max))
        }}
      >
        <svg
          className="dial__svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden
        >
          <path
            className="dial__track"
            d={trackPath}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {valuePath ? (
            <path
              className="dial__value"
              d={valuePath}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          ) : null}
        </svg>
        <span className="dial__readout">{Math.round(ratio * 100)}</span>
      </div>
      <span className="dial__label">{label}</span>
    </div>
  )
}
