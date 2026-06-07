import {
  MIXED_VALUE,
  scaleTypeAbbrevLabel,
  scaleTypeLabel,
  WORKSHOP_SCALE_TYPES,
} from '../lib/scaleSteps'
import './ScaleTypeSelect.css'

type ScaleTypeSelectProps = {
  value: string
  onChange: (scaleType: string) => void
  disabled?: boolean
  ariaLabel: string
  className?: string
  variant?: 'loop-editor' | 'toolbar'
  mixed?: boolean
}

export function ScaleTypeSelect({
  value,
  onChange,
  disabled = false,
  ariaLabel,
  className = '',
  variant = 'loop-editor',
  mixed = false,
}: ScaleTypeSelectProps) {
  const readout =
    value === MIXED_VALUE ? '*' : scaleTypeAbbrevLabel(value)

  return (
    <div className={`scale-type-select scale-type-select--${variant}`.trim()}>
      <select
        className={`scale-type-select__native ${className}`.trim()}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
      >
        {mixed ? <option value={MIXED_VALUE}>*</option> : null}
        {WORKSHOP_SCALE_TYPES.map((option) => (
          <option key={option} value={option}>
            {scaleTypeLabel(option)}
          </option>
        ))}
      </select>
      <span className="scale-type-select__readout" aria-hidden="true">
        {readout}
      </span>
      <span className="scale-type-select__caret" aria-hidden="true">
        ▼
      </span>
    </div>
  )
}
