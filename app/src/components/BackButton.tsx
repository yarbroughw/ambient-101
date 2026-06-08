import './BackButton.css'

function ChevronLeftIcon() {
  return (
    <svg className="back-btn__icon" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
      />
    </svg>
  )
}

type BackButtonProps = {
  onClick: () => void
}

export function BackButton({ onClick }: BackButtonProps) {
  return (
    <button
      type="button"
      className="back-btn"
      aria-label="Back to ensembles"
      onClick={onClick}
    >
      <ChevronLeftIcon />
    </button>
  )
}
