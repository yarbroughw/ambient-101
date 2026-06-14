import { useLayoutEffect, useRef, useState } from 'react'
import {
  MIXED_VALUE,
  scaleTypeAbbrevLabel,
  scaleTypeLabel,
  WORKSHOP_SCALE_TYPES,
} from '../lib/scaleSteps'
import './ScaleTypeSelect.css'

export function scaleTypeReadoutLabel(
  value: string,
  options: { mixed?: boolean; preferFull?: boolean } = {},
): string {
  const { mixed = false, preferFull = false } = options
  const full = scaleTypeLabel(value)
  const abbrev = scaleTypeAbbrevLabel(value)
  const base = preferFull ? full : abbrev
  return mixed ? `${base} *` : base
}

type ScaleTypeSelectProps = {
  value: string
  onChange: (scaleType: string) => void
  disabled?: boolean
  ariaLabel: string
  className?: string
  variant?: 'loop-editor' | 'toolbar'
  mixed?: boolean
  title?: string
}

export function ScaleTypeSelect({
  value,
  onChange,
  disabled = false,
  ariaLabel,
  className = '',
  variant = 'loop-editor',
  mixed = false,
  title,
}: ScaleTypeSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const readoutRef = useRef<HTMLSpanElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [preferFullLabel, setPreferFullLabel] = useState(false)

  const full = scaleTypeLabel(value)
  const labelsDiffer = full !== scaleTypeAbbrevLabel(value)
  const measureText = mixed ? `${full} *` : full
  const readout = scaleTypeReadoutLabel(value, { mixed, preferFull: preferFullLabel })
  const nativeValue = mixed ? MIXED_VALUE : value
  const selectTitle =
    title ?? (!preferFullLabel && labelsDiffer ? full : undefined)

  useLayoutEffect(() => {
    if (!labelsDiffer) {
      setPreferFullLabel(true)
      return
    }

    const root = rootRef.current
    const readoutEl = readoutRef.current
    const measureEl = measureRef.current
    if (!root || !readoutEl || !measureEl) {
      return
    }

    function update() {
      const fits = measureEl.scrollWidth <= readoutEl.clientWidth
      setPreferFullLabel(fits)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(root)
    return () => observer.disconnect()
  }, [labelsDiffer, measureText, variant])

  return (
    <div
      ref={rootRef}
      className={`scale-type-select scale-type-select--${variant}`.trim()}
    >
      <select
        className={`scale-type-select__native ${className}`.trim()}
        value={nativeValue}
        disabled={disabled}
        aria-label={ariaLabel}
        title={selectTitle}
        onChange={(event) => onChange(event.target.value)}
      >
        {mixed ? (
          <option value={MIXED_VALUE}>
            {scaleTypeReadoutLabel(value, { mixed: true, preferFull: preferFullLabel })}
          </option>
        ) : null}
        {WORKSHOP_SCALE_TYPES.map((option) => (
          <option key={option} value={option}>
            {scaleTypeLabel(option)}
          </option>
        ))}
      </select>
      <span ref={readoutRef} className="scale-type-select__readout" aria-hidden="true">
        {readout}
      </span>
      <span
        ref={measureRef}
        className="scale-type-select__readout scale-type-select__measure"
        aria-hidden="true"
      >
        {measureText}
      </span>
      <span className="scale-type-select__caret" aria-hidden="true">
        ▼
      </span>
    </div>
  )
}
