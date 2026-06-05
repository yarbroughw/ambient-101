import { Note, Range, Scale } from 'tonal'
import type { PatternNote } from '../audio/patternTypes'

export type ScalePresentation = 'highlight' | 'fold'

export type GridRow = {
  pitch: string
  inScale: boolean
}

const HIGHLIGHT_PADDING_SEMITONES = 2
const HIGHLIGHT_MIN_SEMITONES = 12

function parseScaleRoot(scale: string): string {
  const match = scale.match(/^([A-G][#b]?)(\d+)/)
  return match ? `${match[1]}${match[2]}` : 'C4'
}

function scaleName(scale: string): string {
  return scale.replace(/^[A-G][#b]?\d+\s+/, '')
}

function scaleDegreePitches(scale: string, from: number, to: number): string[] {
  const degrees = Scale.degrees(scale)
  const pitches: string[] = []

  for (let degree = from; degree <= to; degree += 1) {
    const pitch = degrees(degree)
    if (pitch) {
      pitches.push(pitch)
    }
  }

  return pitches
}

function foldRows(scale: string, notes: PatternNote[]): GridRow[] {
  const foldPitches = scaleDegreePitches(scale, 0, 11)
  const scalePitches = new Set(foldPitches)

  const rows: GridRow[] = foldPitches
    .slice()
    .reverse()
    .map((pitch) => ({ pitch, inScale: true }))

  const extraPitches = new Set<string>()
  for (const note of notes) {
    if (!scalePitches.has(note.pitch)) {
      extraPitches.add(note.pitch)
    }
  }

  const sortedExtras = [...extraPitches].sort(
    (a, b) => (Note.midi(b) ?? 0) - (Note.midi(a) ?? 0),
  )

  for (const pitch of sortedExtras) {
    rows.push({ pitch, inScale: false })
  }

  return rows
}

function highlightRows(scale: string, notes: PatternNote[]): GridRow[] {
  const root = parseScaleRoot(scale)
  const scalePitchClasses = new Set(Scale.get(scale).notes)

  const midis = notes
    .map((n) => Note.midi(n.pitch))
    .filter((m): m is number => m != null)

  let minMidi = Note.midi(root) ?? 60
  let maxMidi = minMidi + 12

  if (midis.length > 0) {
    minMidi = Math.min(...midis) - HIGHLIGHT_PADDING_SEMITONES
    maxMidi = Math.max(...midis) + HIGHLIGHT_PADDING_SEMITONES
  }

  if (maxMidi - minMidi < HIGHLIGHT_MIN_SEMITONES) {
    const center = (minMidi + maxMidi) / 2
    minMidi = Math.floor(center - HIGHLIGHT_MIN_SEMITONES / 2)
    maxMidi = minMidi + HIGHLIGHT_MIN_SEMITONES
  }

  const low = Note.fromMidi(minMidi)
  const high = Note.fromMidi(maxMidi)
  if (!low || !high) {
    return foldRows(scale, notes)
  }

  const chromatic = Range.chromatic([high, low])
  return chromatic.map((pitch) => {
    const pitchClass = Note.pitchClass(pitch)
    return {
      pitch,
      inScale: pitchClass != null && scalePitchClasses.has(pitchClass),
    }
  })
}

export function gridRows(
  scale: string,
  notes: PatternNote[],
  presentation: ScalePresentation,
): GridRow[] {
  if (presentation === 'fold') {
    return foldRows(scale, notes)
  }
  return highlightRows(scale, notes)
}

export function scaleLabel(scale: string): string {
  return scaleName(scale)
}
