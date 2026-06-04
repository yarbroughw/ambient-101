import { useState } from 'react'
import { ensureAudioStarted } from '../audio/audioSession'

type StartAudioButtonProps = {
  onReady: () => void
}

export function StartAudioButton({ onReady }: StartAudioButtonProps) {
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
        className="ensemble-btn ensemble-btn--play"
        onClick={handleClick}
        disabled={busy}
      >
        {busy ? 'starting…' : 'start audio'}
      </button>
      {error ? <p className="hint" style={{ color: 'var(--color-stop)' }}>{error}</p> : null}
    </div>
  )
}
