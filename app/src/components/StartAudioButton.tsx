import { useState } from 'react'
import { ensureAudioStarted } from '../audio/audioSession'

type StartAudioButtonProps = {
  onReady: () => void
  disabled?: boolean
}

export function StartAudioButton({ onReady, disabled = false }: StartAudioButtonProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setBusy(true)
    setError(null)
    try {
      await ensureAudioStarted()
      onReady()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start audio')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="start-audio">
      <button
        type="button"
        className="ensemble-btn ensemble-btn--play start-audio__button"
        onClick={handleClick}
        disabled={busy || disabled}
      >
        {busy ? 'starting…' : 'start'}
      </button>
      {error ? (
        <p className="start-audio__error">{error}</p>
      ) : null}
    </div>
  )
}
