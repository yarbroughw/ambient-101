import { useRef } from 'react'
import './LoopVolumeFader.css'

type LoopVolumeFaderProps = {
  value: number
  disabled?: boolean
  onChange: (value: number) => void
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function LoopVolumeFader({
  value,
  disabled = false,
  onChange,
}: LoopVolumeFaderProps) {
  const dragRef = useRef<{ originY: number; originValue: number } | null>(null)

  function valueFromClientY(clientY: number, originY: number, originValue: number) {
    const delta = (originY - clientY) * 0.008
    return clamp(originValue + delta)
  }

  return (
    <div
      className={`loop-volume${disabled ? ' loop-volume--disabled' : ''}`}
      role="slider"
      aria-label="Loop volume"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-disabled={disabled}
      onPointerDown={(event) => {
        if (disabled) {
          return
        }

        event.preventDefault()
        dragRef.current = { originY: event.clientY, originValue: value }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (!dragRef.current || disabled) {
          return
        }

        onChange(
          valueFromClientY(
            event.clientY,
            dragRef.current.originY,
            dragRef.current.originValue,
          ),
        )
      }}
      onPointerUp={() => {
        dragRef.current = null
      }}
      onPointerCancel={() => {
        dragRef.current = null
      }}
      onKeyDown={(event) => {
        if (disabled) {
          return
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault()
          onChange(clamp(value + 0.05))
        } else if (event.key === 'ArrowDown') {
          event.preventDefault()
          onChange(clamp(value - 0.05))
        }
      }}
      tabIndex={disabled ? -1 : 0}
    >
      <div
        className="loop-volume__notch"
        style={{ bottom: `${value * 100}%` }}
        aria-hidden
      >
        <span className="loop-volume__triangle" />
      </div>
    </div>
  )
}
