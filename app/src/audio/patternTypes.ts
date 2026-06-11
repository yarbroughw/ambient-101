export type PatternNote = {
  scaleStep: number
  startCol: number
  spanCols: number
  velocity?: number
}

export type LoopPattern = {
  id: string
  label: string
  /** Tape-loop period stored as integer milliseconds (baseline, before global pace). */
  loopDurationMs: number
  bpm: number
  /** Active grid width in columns (1..32). The melody loops at this length. */
  loopCols: number
  root: string
  scale: string
  octaveShift: number
  instrument: string
  volume: number
  reverb: number
  delay: number
  notes: PatternNote[]
}

export type MelodyBounds = {
  start: number
  end: number
  span: number
}

export function melodyBounds(notes: PatternNote[]): MelodyBounds {
  if (notes.length === 0) {
    return { start: 0, end: 0, span: 0 }
  }

  const start = Math.min(...notes.map((n) => n.startCol))
  const end = Math.max(...notes.map((n) => n.startCol + n.spanCols))
  return { start, end, span: end - start }
}
