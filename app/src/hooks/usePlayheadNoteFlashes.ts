import { useEffect, useRef, useState } from 'react'
import type { PatternNote } from '../audio/patternTypes'
import { noteKey, noteStartTime } from '../lib/gridLayout'

// Heard playhead advances a few ms to tens of ms per frame after latency
// unclamps; a single-frame jump past this is a mid-playback mount, not the
// downbeat at column 0.
const MAX_DOWNBEAT_CROSS_JUMP_SEC = 0.5

function playheadCrossedNote(
  prevTimeSec: number,
  nextTimeSec: number,
  noteStartSec: number,
  periodSec: number,
): boolean {
  if (nextTimeSec >= prevTimeSec) {
    if (noteStartSec === 0 && prevTimeSec === 0 && nextTimeSec > 0) {
      return nextTimeSec - prevTimeSec <= MAX_DOWNBEAT_CROSS_JUMP_SEC
    }
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
