import {
  DEFAULT_ROOT,
  DEFAULT_SCALE_TYPE,
  globalSelectValue,
  MIXED_VALUE,
  ROOT_PITCH_CLASSES,
} from '../lib/scaleSteps'
import { ScaleTypeSelect } from './ScaleTypeSelect'

type GlobalTonalityToolbarProps = {
  disabled?: boolean
  reelRoots: string[]
  reelScaleTypes: string[]
  onGlobalRootChange: (root: string) => void
  onGlobalScaleChange: (scaleType: string) => void
}

export function GlobalTonalityToolbar({
  disabled = false,
  reelRoots,
  reelScaleTypes,
  onGlobalRootChange,
  onGlobalScaleChange,
}: GlobalTonalityToolbarProps) {
  const rootValue = globalSelectValue(reelRoots, DEFAULT_ROOT)
  const scaleValue = globalSelectValue(reelScaleTypes, DEFAULT_SCALE_TYPE)
  const rootMixed = rootValue === MIXED_VALUE
  const scaleMixed = scaleValue === MIXED_VALUE
  const noReels = reelRoots.length === 0

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
          value={rootValue}
          disabled={disabled || noReels}
          aria-label="Global root"
          onChange={(event) => handleRootChange(event.target.value)}
        >
          {rootMixed ? <option value={MIXED_VALUE}>*</option> : null}
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
          disabled={disabled || noReels}
          ariaLabel="Global scale"
          mixed={scaleMixed}
          onChange={handleScaleChange}
        />
      </label>
    </div>
  )
}
