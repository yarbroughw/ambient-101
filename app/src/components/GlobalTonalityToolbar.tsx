import { MIXED_VALUE, ROOT_PITCH_CLASSES } from '../lib/scaleSteps'
import { ScaleTypeSelect } from './ScaleTypeSelect'

type GlobalTonalityToolbarProps = {
  disabled?: boolean
  rootValue: string
  rootMixed: boolean
  scaleValue: string
  scaleMixed: boolean
  onGlobalRootChange: (root: string) => void
  onGlobalScaleChange: (scaleType: string) => void
}

const MIXED_TITLE = 'Reels differ — pick a value to apply it to all reels'

export function GlobalTonalityToolbar({
  disabled = false,
  rootValue,
  rootMixed,
  scaleValue,
  scaleMixed,
  onGlobalRootChange,
  onGlobalScaleChange,
}: GlobalTonalityToolbarProps) {
  // When reels disagree the native value stays MIXED so selecting any option
  // (including the displayed one) fires a change and unifies every reel.
  const rootNativeValue = rootMixed ? MIXED_VALUE : rootValue

  function handleRootChange(next: string) {
    if (next === MIXED_VALUE) {
      return
    }
    onGlobalRootChange(next)
  }

  function handleScaleChange(next: string) {
    if (next === MIXED_VALUE) {
      return
    }
    onGlobalScaleChange(next)
  }

  return (
    <div className="toolbar__tonality" aria-label="Global tonality">
      <label className="toolbar__tonality-field">
        <span className="toolbar__tonality-label">root</span>
        <select
          className="toolbar__tonality-select toolbar__tonality-select--root"
          value={rootNativeValue}
          disabled={disabled}
          aria-label="Global root"
          title={rootMixed ? MIXED_TITLE : undefined}
          onChange={(event) => handleRootChange(event.target.value)}
        >
          {rootMixed ? (
            <option value={MIXED_VALUE}>{`${rootValue} *`}</option>
          ) : null}
          {ROOT_PITCH_CLASSES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="toolbar__tonality-field">
        <span className="toolbar__tonality-label">scale</span>
        <ScaleTypeSelect
          className="toolbar__tonality-select"
          variant="toolbar"
          value={scaleValue}
          disabled={disabled}
          ariaLabel="Global scale"
          mixed={scaleMixed}
          title={scaleMixed ? MIXED_TITLE : undefined}
          onChange={handleScaleChange}
        />
      </label>
    </div>
  )
}
