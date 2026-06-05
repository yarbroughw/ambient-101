import { Note } from 'tonal'
import { melodyBounds, type PatternNote } from '../audio/patternTypes'
import { melodyPlayheadRatio } from '../lib/melodyPlayhead'

const VERTICAL_PITCH_PADDING = 0.2

type MiniMelodyViewProps = {
  notes: PatternNote[]
  loopTimeSec: number
  showPlayhead: boolean
}

function pitchRange(notes: PatternNote[]): { min: number; max: number } {
  const midis = notes
    .map((n) => Note.midi(n.pitch))
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
  notes,
  loopTimeSec,
  showPlayhead,
}: MiniMelodyViewProps) {
  const bounds = melodyBounds(notes)
  const { min, max } = pitchRange(notes)
  const playheadRatio = melodyPlayheadRatio(loopTimeSec, bounds)

  if (bounds.span <= 0) {
    return (
      <div className="mini-melody mini-melody--empty" aria-hidden>
        <span className="mini-melody__placeholder">—</span>
      </div>
    )
  }

  return (
    <div
      className="mini-melody"
      aria-label="Melody pattern"
      role="img"
    >
      <div className="mini-melody__track">
        {notes.map((note, index) => {
          const left =
            ((note.startTime - bounds.start) / bounds.span) * 100
          const width = (note.duration / bounds.span) * 100
          return (
            <span
              key={`${note.pitch}-${note.startTime}-${index}`}
              className="mini-melody__note"
              style={{
                left: `${left}%`,
                width: `${Math.max(width, 2)}%`,
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
