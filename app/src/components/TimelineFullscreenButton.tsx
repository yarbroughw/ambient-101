import './TimelineFullscreenButton.css'

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden>
      <path
        d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        fill="none"
      />
    </svg>
  )
}

function CompressIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden>
      <path
        d="M6 2v4H2M14 6h-4V2M10 14v-4h4M2 10h4v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        fill="none"
      />
    </svg>
  )
}

type TimelineFullscreenButtonProps = {
  active: boolean
  hidden?: boolean
  showHoverTooltips?: boolean
  onClick: () => void
}

export function TimelineFullscreenButton({
  active,
  hidden = false,
  showHoverTooltips = true,
  onClick,
}: TimelineFullscreenButtonProps) {
  const Icon = active ? CompressIcon : ExpandIcon

  return (
    <button
      type="button"
      className={`timeline-fullscreen-btn${active ? ' is-active' : ''}${
        hidden ? ' timeline-fullscreen-btn--hidden' : ''
      }`}
      aria-pressed={active}
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      aria-label={active ? 'Exit fullscreen timeline' : 'Fullscreen timeline'}
      title={
        hidden || !showHoverTooltips
          ? undefined
          : active
            ? 'exit fullscreen (f)'
            : 'fullscreen timeline (f)'
      }
      disabled={hidden}
      onClick={onClick}
    >
      <Icon className="timeline-fullscreen-btn__icon" />
    </button>
  )
}
