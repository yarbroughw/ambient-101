import { useEffect, useState } from 'react'

export function useAnimationFrame(active: boolean): number {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!active) {
      return
    }

    let id = 0
    const tick = () => {
      setFrame((n) => n + 1)
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [active])

  return frame
}
