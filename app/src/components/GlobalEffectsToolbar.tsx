import { useState } from 'react'
import { Dial } from './Dial'
import { getGlobalVolume, setGlobalVolume } from '../audio/globalEffects'
import './Dial.css'

type GlobalEffectsToolbarProps = {
  disabled?: boolean
}

export function GlobalEffectsToolbar({ disabled = false }: GlobalEffectsToolbarProps) {
  const [volume, setVolume] = useState(getGlobalVolume)

  function handleVolumeChange(value: number) {
    setVolume(value)
    setGlobalVolume(value)
  }

  return (
    <div className="toolbar__effects" aria-label="Global volume">
      <Dial
        className="dial--toolbar"
        label="volume"
        value={volume}
        disabled={disabled}
        onChange={handleVolumeChange}
      />
    </div>
  )
}
