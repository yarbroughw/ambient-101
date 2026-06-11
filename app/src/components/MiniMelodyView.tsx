import { memo } from 'react'
import { Note } from 'tonal'
import type { LoopPattern } from '../audio/patternTypes'
import {
  gridPlayheadRatio,
  melodyWindowDuration,
  noteKey,
} from '../lib/gridLayout'
import { resolvePatternNotes } from '../lib/scaleSteps'
import { usePlayheadNoteFlashes } from '../hooks/usePlayheadNoteFlashes'

const VERTICAL_PITCH_PADDING = 0.2

type MiniMelodyViewProps = {
  pattern: Pick<
    LoopPattern,
    'notes' | 'root' | 'scale' | 'octaveShift' | 'bpm' | 'loopCols'
  >
  loopTimeSec: number
  showPlayhead: boolean
  flashNotes?: boolean
  periodSec?: number
  /** See usePlayheadNoteFlashes: previous-playhead stand-in for the first flashing frame. */
  flashSeedSec?: number | null
}

function pitchRange(pitches: string[]): { min: number; max: number } {
  const midis = pitches
    .map((pitch) => Note.midi(pitch))
    .filter((m): m is number => m != null)

  if (midis.length === 0) {
    return { min: 60, max: 60 }
  }

  return { min: Math.min(...midis), max: Math.max(...midis) }
}

function laneTop(
  pitch: string,
  minMidi: number,
  maxMidi: number,
): string {
  const midi = Note.midi(pitch) ?? minMidi

  if (minMidi === maxMidi) {
    return '50%'
  }

  const span = maxMidi - minMidi
  const t = (midi - minMidi) / span
  const usable = 1 - VERTICAL_PITCH_PADDING * 2
  const position = VERTICAL_PITCH_PADDING + usable * (1 - t)
  return `${position * 100}%`
}

// Memoized so the repeated copies in the ensemble timeline (which receive
// frame-stable props) skip per-animation-frame re-renders.
export const MiniMelodyView = memo(function MiniMelodyView({
  pattern,
  loopTimeSec,
  showPlayhead,
  flashNotes = false,
  periodSec = 0,
  flashSeedSec = null,
}: MiniMelodyViewProps) {
  const loopCols = pattern.loopCols
  const melodyWindow = melodyWindowDuration(pattern.bpm, loopCols)
  const resolved = resolvePatternNotes(pattern).filter(
    (note) => note.startCol < loopCols,
  )
  const pitches = resolved.map((note) => note.pitch)
  const { min, max } = pitchRange(pitches)
  const playheadRatio = gridPlayheadRatio(loopTimeSec, melodyWindow)
  const noteFlashes = usePlayheadNoteFlashes(
    loopTimeSec,
    resolved,
    pattern.bpm,
    periodSec,
    flashNotes && periodSec > 0,
    flashSeedSec,
  )

  return (
    <div
      className="mini-melody"
      aria-label="Melody pattern"
      role="img"
    >
      <div className="mini-melody__track">
        {resolved.map((note, index) => {
          const left = (note.startCol / loopCols) * 100
          const width = (note.spanCols / loopCols) * 100
          const key = noteKey(note)
          const flashCount = noteFlashes[key] ?? 0

          return (
            <span
              key={`${key}-${index}-${flashCount}`}
              className={`mini-melody__note${flashCount > 0 ? ' mini-melody__note--flash' : ''}`}
              style={{
                left: `${left}%`,
                width: `${Math.max(width, 0.5)}%`,
                top: laneTop(note.pitch, min, max),
              }}
            />
          )
        })}
        {showPlayhead && playheadRatio !== null ? (
          <span
            className="mini-melody__playhead"
            style={{ left: `${playheadRatio * 100}%` }}
          />
        ) : null}
      </div>
    </div>
  )
})
