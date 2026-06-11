import { useEffect, useRef, useState } from 'react'
import type { PatternNote } from '../audio/patternTypes'
import { noteKey, noteStartTime } from '../lib/gridLayout'

function playheadCrossedNote(
  prevTimeSec: number,
  nextTimeSec: number,
  noteStartSec: number,
  periodSec: number,
): boolean {
  if (nextTimeSec >= prevTimeSec) {
    return noteStartSec > prevTimeSec && noteStartSec <= nextTimeSec
  }

  return (
    (noteStartSec > prevTimeSec && noteStartSec <= periodSec) ||
    (noteStartSec >= 0 && noteStartSec <= nextTimeSec)
  )
}

export function usePlayheadNoteFlashes(
  loopTimeSec: number,
  notes: PatternNote[],
  bpm: number,
  periodSec: number,
  enabled: boolean,
  /**
   * Stand-in for the previous playhead position on the first enabled frame.
   * Without it, notes crossed on that frame are swallowed — the ensemble
   * timeline hands flashing over to a freshly-activated tile exactly at the
   * seam, where the first note sits. Null keeps the old "no backfill on
   * mount" behavior.
   */
  seedTimeSec: number | null = null,
): Record<string, number> {
  const [flashes, setFlashes] = useState<Record<string, number>>({})
  const prevTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) {
      prevTimeRef.current = null
      return
    }

    const prevTimeSec = prevTimeRef.current ?? seedTimeSec
    prevTimeRef.current = loopTimeSec

    if (prevTimeSec === null || prevTimeSec === loopTimeSec) {
      return
    }

    const crossedKeys: string[] = []
    for (const note of notes) {
      const startSec = noteStartTime(note, bpm)
      if (
        playheadCrossedNote(prevTimeSec, loopTimeSec, startSec, periodSec)
      ) {
        crossedKeys.push(noteKey(note))
      }
    }

    if (crossedKeys.length === 0) {
      return
    }

    setFlashes((current) => {
      const next = { ...current }
      for (const key of crossedKeys) {
        next[key] = (next[key] ?? 0) + 1
      }
      return next
    })
  }, [loopTimeSec, notes, bpm, periodSec, enabled, seedTimeSec])

  return flashes
}
