import { useEffect, useState } from 'react'
import type { TapeLoop } from '../audio/tapeLoop'

const LAP_PROGRESS = 0.05

export function useLoopReelVisuals(loop: TapeLoop, running: boolean) {
  const [angleDeg, setAngleDeg] = useState(0)
  const [lapFlashKey, setLapFlashKey] = useState(0)

  useEffect(() => {
    if (!running) {
      return
    }

    let inLapWindow = false
    let frameId = 0

    const tick = () => {
      const progress = loop.getProgress()

      if (progress < LAP_PROGRESS) {
        if (!inLapWindow) {
          inLapWindow = true
          setLapFlashKey((key) => key + 1)
        }
      } else {
        inLapWindow = false
      }

      setAngleDeg(progress * 360)
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [running, loop])

  if (!running) {
    return { angleDeg: 0, lapFlashKey: 0 }
  }

  return { angleDeg, lapFlashKey }
}
