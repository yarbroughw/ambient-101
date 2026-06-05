export type PatternNote = {
  pitch: string
  startTime: number
  duration: number
  velocity?: number
}

export type LoopPattern = {
  id: string
  label: string
  loopDuration: number
  bpm: number
  scale: string
  instrument: string
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

  const start = Math.min(...notes.map((n) => n.startTime))
  const end = Math.max(...notes.map((n) => n.startTime + n.duration))
  return { start, end, span: end - start }
}
