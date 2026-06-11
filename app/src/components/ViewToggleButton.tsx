import './ViewToggleButton.css'

export type ReelViewMode = 'stack' | 'timeline'

type ViewToggleProps = {
  mode: ReelViewMode
  disabled?: boolean
  onModeChange: (mode: ReelViewMode) => void
}

export function ViewToggle({
  mode,
  disabled = false,
  onModeChange,
}: ViewToggleProps) {
  return (
    <div className="view-toggle" role="group" aria-label="Reel area view">
      <button
        type="button"
        className={`view-toggle__option${mode === 'stack' ? ' is-active' : ''}`}
        disabled={disabled}
        aria-pressed={mode === 'stack'}
        title="edit reels (t)"
        onClick={() => onModeChange('stack')}
      >
        reels
      </button>
      <button
        type="button"
        className={`view-toggle__option${mode === 'timeline' ? ' is-active' : ''}`}
        disabled={disabled}
        aria-pressed={mode === 'timeline'}
        title="watch the tapes phase (t)"
        onClick={() => onModeChange('timeline')}
      >
        timeline
      </button>
    </div>
  )
}
