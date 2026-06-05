import { useEffect, useState } from 'react'
import type { TapeLoop } from '../audio/tapeLoop'
import { normalizeMeterLevel } from '../lib/meterLevel'

export function useLoopLevel(loop: TapeLoop, active: boolean) {
  const [level, setLevel] = useState(0)
  const [peak, setPeak] = useState(0)

  useEffect(() => {
    if (!active) {
      setLevel(0)
      setPeak(0)
      return
    }

    let display = 0
    let peakHold = 0
    let frameId = 0

    const tick = () => {
      const raw = normalizeMeterLevel(loop.getLevel())
      display = display * 0.72 + raw * 0.28
      peakHold = Math.max(peakHold * 0.965, display)
      setLevel(display)
      setPeak(peakHold)
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [active, loop])

  return { level, peak }
}
