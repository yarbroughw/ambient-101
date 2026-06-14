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
  /**
   * Per-reel voice overrides. All optional: when absent the instrument's recipe
   * default is used, so older saved loops and presets load unchanged. Cleared on
   * instrument change (each instrument has its own natural brightness/envelope).
   */
  /** Low-pass filter cutoff in Hz. Default: instrument recipe filterFrequency. */
  cutoff?: number
  /** Low-pass filter resonance (Q). Default: ~1. */
  resonance?: number
  /** Chorus wet amount, 0–1. Default: 0 (dry). */
  chorus?: number
  /**
   * Synth output gain, 0–1. Default: 1. Tames the instrument's own loudness
   * (e.g. to soften a dense, multi-note voice). Distinct from `volume`, which
   * is the reel-level fader for relative balance between reels.
   */
  gain?: number
  /** Amplitude envelope attack in seconds. Overrides recipe envelope.attack. */
  attack?: number
  /** Amplitude envelope release in seconds. Overrides recipe envelope.release. */
  release?: number
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
