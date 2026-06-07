import { Note } from 'tonal'
import type { LoopPattern } from '../audio/patternTypes'
import {
  gridPlayheadRatio,
  melodyWindowDuration,
} from '../lib/gridLayout'
import { resolvePatternNotes } from '../lib/scaleSteps'

const VERTICAL_PITCH_PADDING = 0.2

type MiniMelodyViewProps = {
  pattern: Pick<LoopPattern, 'notes' | 'root' | 'scale' | 'octaveShift' | 'bpm'>
  loopTimeSec: number
  showPlayhead: boolean
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

export function MiniMelodyView({
  pattern,
  loopTimeSec,
  showPlayhead,
}: MiniMelodyViewProps) {
  const melodyWindow = melodyWindowDuration(pattern.bpm)
  const resolved = resolvePatternNotes(pattern)
  const pitches = resolved.map((note) => note.pitch)
  const { min, max } = pitchRange(pitches)
  const playheadRatio = gridPlayheadRatio(loopTimeSec, melodyWindow)

  return (
    <div
      className="mini-melody"
      aria-label="Melody pattern"
      role="img"
    >
      <div className="mini-melody__track">
        {resolved.map((note, index) => {
          const left = (note.startTime / melodyWindow) * 100
          const width = (note.duration / melodyWindow) * 100

          return (
            <span
              key={`${note.scaleStep}-${note.startTime}-${index}`}
              className="mini-melody__note"
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
}
