import { Scale } from 'tonal'
import type { LoopPattern, PatternNote } from '../audio/patternTypes'

export const GRID_SCALE_STEP_MIN = -11
export const GRID_SCALE_STEP_MAX = 11
export const OCTAVE_SHIFT_MIN = -2
export const OCTAVE_SHIFT_MAX = 2

export const WORKSHOP_SCALES = [
  'C4 minor',
  'C4 major',
  'C4 dorian',
  'C4 phrygian',
  'C4 lydian',
  'C4 mixolydian',
  'C4 locrian',
  'C4 harmonic minor',
  'C4 melodic minor',
  'C4 minor pentatonic',
  'C4 major pentatonic',
] as const

export type WorkshopScale = (typeof WORKSHOP_SCALES)[number]

export function stepsPerOctave(scale: string): number {
  return Scale.get(scale).notes.length
}

/** 0 = root; +1 = one scale step up; −1 = one step down (Tonal negative degrees). */
export function tonalDegreeForScaleStep(scaleStep: number): number {
  return scaleStep >= 0 ? scaleStep + 1 : scaleStep
}

export function effectiveScaleStep(
  scaleStep: number,
  octaveShift: number,
  scale: string,
): number {
  return scaleStep + octaveShift * stepsPerOctave(scale)
}

export function stepToPitch(
  scale: string,
  scaleStep: number,
  octaveShift = 0,
): string {
  const effective = effectiveScaleStep(scaleStep, octaveShift, scale)
  const pitch = Scale.degrees(scale)(tonalDegreeForScaleStep(effective))
  return pitch || 'C4'
}

export function formatScaleStepLabel(scaleStep: number): string {
  return scaleStep > 0 ? `+${scaleStep}` : String(scaleStep)
}

export function scaleLabel(scale: string): string {
  return scale.replace(/^[A-G][#b]?\d+\s+/, '')
}

export function gridScaleStepsHighToLow(): number[] {
  const steps: number[] = []
  for (let step = GRID_SCALE_STEP_MAX; step >= GRID_SCALE_STEP_MIN; step -= 1) {
    steps.push(step)
  }
  return steps
}

export type GridScaleRow = {
  scaleStep: number
  stepLabel: string
  pitchName: string
}

export function gridScaleRows(scale: string, octaveShift: number): GridScaleRow[] {
  return gridScaleStepsHighToLow().map((scaleStep) => ({
    scaleStep,
    stepLabel: formatScaleStepLabel(scaleStep),
    pitchName: stepToPitch(scale, scaleStep, octaveShift),
  }))
}

export type ResolvedPatternNote = PatternNote & { pitch: string }

export function resolvePatternNotes(
  pattern: Pick<LoopPattern, 'notes' | 'scale' | 'octaveShift'>,
): ResolvedPatternNote[] {
  return pattern.notes.map((note) => ({
    ...note,
    pitch: stepToPitch(pattern.scale, note.scaleStep, pattern.octaveShift),
  }))
}

export function clampOctaveShift(shift: number): number {
  return Math.min(OCTAVE_SHIFT_MAX, Math.max(OCTAVE_SHIFT_MIN, shift))
}

export function isGridScaleStep(scaleStep: number): boolean {
  return scaleStep >= GRID_SCALE_STEP_MIN && scaleStep <= GRID_SCALE_STEP_MAX
}
