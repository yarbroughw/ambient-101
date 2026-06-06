import { useEffect, useState } from 'react'
import type { TapeLoop } from '../audio/tapeLoop'

const LAP_PROGRESS = 0.05

export function useLoopProgress(
  loop: TapeLoop,
  running: boolean,
  testNonce = 0,
) {
  const [angleDeg, setAngleDeg] = useState(0)
  const [lapFlashKey, setLapFlashKey] = useState(0)
  const [loopTimeSec, setLoopTimeSec] = useState(0)
  const [progress, setProgress] = useState(0)
  const [melodyPlaybackActive, setMelodyPlaybackActive] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    let inLapWindow = false
    let frameId = 0

    const tick = () => {
      const isTesting = loop.isTesting() && !running
      setTesting(isTesting)

      if (!running && !isTesting) {
        setMelodyPlaybackActive(false)
        setLoopTimeSec(0)
        setProgress(0)
        setAngleDeg(0)
        return
      }

      setMelodyPlaybackActive(true)

      if (running) {
        const p = loop.getProgress()
        if (p < LAP_PROGRESS) {
          if (!inLapWindow) {
            inLapWindow = true
            setLapFlashKey((key) => key + 1)
          }
        } else {
          inLapWindow = false
        }

        setProgress(p)
        setLoopTimeSec(loop.getLoopTimeSec())
        setAngleDeg(p * 360)
      } else {
        setLoopTimeSec(loop.getLoopTimeSec())
      }

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [running, loop, testNonce])

  return {
    angleDeg: running ? angleDeg : 0,
    lapFlashKey: running ? lapFlashKey : 0,
    loopTimeSec,
    progress: running ? progress : 0,
    melodyPlaybackActive,
    testing,
  }
}
