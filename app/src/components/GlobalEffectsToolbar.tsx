import { useState } from 'react'
import { Dial } from './Dial'
import {
  getGlobalDelay,
  getGlobalReverb,
  getGlobalVolume,
  setGlobalDelay,
  setGlobalReverb,
  setGlobalVolume,
} from '../audio/globalEffects'
import './Dial.css'

type GlobalEffectsToolbarProps = {
  disabled?: boolean
}

export function GlobalEffectsToolbar({
  disabled = false,
}: GlobalEffectsToolbarProps) {
  const [volume, setVolume] = useState(getGlobalVolume)
  const [reverb, setReverb] = useState(getGlobalReverb)
  const [delay, setDelay] = useState(getGlobalDelay)

  function handleVolumeChange(value: number) {
    setVolume(value)
    setGlobalVolume(value)
  }

  function handleReverbChange(value: number) {
    setReverb(value)
    setGlobalReverb(value)
  }

  function handleDelayChange(value: number) {
    setDelay(value)
    setGlobalDelay(value)
  }

  return (
    <div className="toolbar__effects" aria-label="Global effects">
      <div className="toolbar__effects-fx">
        <Dial
          label="reverb"
          value={reverb}
          disabled={disabled}
          onChange={handleReverbChange}
        />
        <Dial
          label="delay"
          value={delay}
          disabled={disabled}
          onChange={handleDelayChange}
        />
      </div>
      <div className="toolbar__effects-divider" aria-hidden />
      <Dial
        label="volume"
        value={volume}
        disabled={disabled}
        onChange={handleVolumeChange}
      />
    </div>
  )
}
