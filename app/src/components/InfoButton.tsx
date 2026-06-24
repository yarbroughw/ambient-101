import { useState } from 'react'
import { InfoPanel, type InfoScreen } from './InfoPanel'
import './InfoButton.css'

type InfoButtonProps = {
  screen: InfoScreen
  disabled?: boolean
}

export function InfoButton({ screen, disabled = false }: InfoButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="info-btn"
        disabled={disabled}
        aria-label="About this app"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        ?
      </button>
      <InfoPanel open={open} screen={screen} onClose={() => setOpen(false)} />
    </>
  )
}
