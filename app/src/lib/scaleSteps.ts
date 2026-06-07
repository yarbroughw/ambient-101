import { Note, Scale } from 'tonal'
import type { LoopPattern, PatternNote } from '../audio/patternTypes'

export const GRID_SCALE_STEP_MIN = -11
export const GRID_SCALE_STEP_MAX = 11
export const OCTAVE_SHIFT_MIN = -2
export const OCTAVE_SHIFT_MAX = 2

/** Roots are anchored here so every pitch class sits near middle C (C4–B4). */
export const ROOT_OCTAVE = 4

export const ROOT_PITCH_CLASSES = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const

export type WorkshopRoot = (typeof ROOT_PITCH_CLASSES)[number]

export const DEFAULT_ROOT: WorkshopRoot = 'C'

export const WORKSHOP_SCALE_TYPES = [
  'minor',
  'major',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'locrian',
  'harmonic minor',
  'melodic minor',
  'minor pentatonic',
  'major pentatonic',
  'phrygian dominant',
  'lydian dominant',
  'harmonic major',
  'hungarian minor',
  'altered',
  'whole tone',
  'diminished',
  'hirajoshi',
  'in-sen',
  'egyptian',
  'major blues',
  'minor blues',
] as const

export type WorkshopScaleType = (typeof WORKSHOP_SCALE_TYPES)[number]

export const DEFAULT_SCALE_TYPE: WorkshopScaleType = 'minor'

export type PatternTonality = Pick<LoopPattern, 'root' | 'scale'>

export function normalizeRoot(pitchClass: string): WorkshopRoot {
  const chroma = Note.chroma(pitchClass)
  if (chroma == null || Number.isNaN(chroma)) {
    return DEFAULT_ROOT
  }

  return ROOT_PITCH_CLASSES[chroma] ?? DEFAULT_ROOT
}

export function isWorkshopScaleType(scaleType: string): scaleType is WorkshopScaleType {
  return (WORKSHOP_SCALE_TYPES as readonly string[]).includes(scaleType)
}

export function parsePatternTonality(scale: string): {
  root: WorkshopRoot
  scaleType: WorkshopScaleType
} {
  const [tonic, ...rest] = Scale.tokenize(scale)
  const scaleType = rest.join(' ')
  const parsedRoot = normalizeRoot(Note.pitchClass(tonic) || DEFAULT_ROOT)
  const parsedScaleType = isWorkshopScaleType(scaleType)
    ? scaleType
    : DEFAULT_SCALE_TYPE

  return { root: parsedRoot, scaleType: parsedScaleType }
}

export function normalizePatternTonality(
  root: string | undefined,
  scale: string,
): PatternTonality {
  if (/^[A-G][#b]?\d/.test(scale)) {
    const parsed = parsePatternTonality(scale)
    return {
      root: root ? normalizeRoot(root) : parsed.root,
      scale: parsed.scaleType,
    }
  }

  return {
    root: root ? normalizeRoot(root) : DEFAULT_ROOT,
    scale: isWorkshopScaleType(scale) ? scale : DEFAULT_SCALE_TYPE,
  }
}

export function patternScaleName(tonality: PatternTonality): string {
  return `${tonality.root}${ROOT_OCTAVE} ${tonality.scale}`
}

export function tonalityLabel(tonality: PatternTonality): string {
  const root = normalizeRoot(tonality.root)
  return `${root} ${tonality.scale}`
}

export function stepsPerOctave(tonality: PatternTonality): number {
  return Scale.get(patternScaleName(tonality)).notes.length
}

/** 0 = root; +1 = one scale step up; −1 = one step down (Tonal negative degrees). */
export function tonalDegreeForScaleStep(scaleStep: number): number {
  return scaleStep >= 0 ? scaleStep + 1 : scaleStep
}

export function effectiveScaleStep(
  scaleStep: number,
  octaveShift: number,
  tonality: PatternTonality,
): number {
  return scaleStep + octaveShift * stepsPerOctave(tonality)
}

export function stepToPitch(
  tonality: PatternTonality,
  scaleStep: number,
  octaveShift = 0,
): string {
  const scaleName = patternScaleName(tonality)
  const effective = effectiveScaleStep(scaleStep, octaveShift, tonality)
  const pitch = Scale.degrees(scaleName)(tonalDegreeForScaleStep(effective))
  return pitch || `${tonality.root}${ROOT_OCTAVE}`
}

export function formatScaleStepLabel(scaleStep: number): string {
  return scaleStep > 0 ? `+${scaleStep}` : String(scaleStep)
}

export function scaleTypeLabel(scaleType: string): string {
  return scaleType
}

const SCALE_TYPE_ABBREV: Record<WorkshopScaleType, string> = {
  minor: 'minor',
  major: 'major',
  dorian: 'dorian',
  phrygian: 'phrygian',
  lydian: 'lydian',
  mixolydian: 'mixolyd.',
  locrian: 'locrian',
  'harmonic minor': 'harm. minor',
  'melodic minor': 'mel. minor',
  'minor pentatonic': 'min. pent.',
  'major pentatonic': 'maj. pent.',
  'phrygian dominant': 'phryg. dom.',
  'lydian dominant': 'lyd. dom.',
  'harmonic major': 'harm. major',
  'hungarian minor': 'hung. minor',
  altered: 'altered',
  'whole tone': 'whole tone',
  diminished: 'diminished',
  hirajoshi: 'hirajoshi',
  'in-sen': 'in-sen',
  egyptian: 'egyptian',
  'major blues': 'maj. blues',
  'minor blues': 'min. blues',
}

export function scaleTypeAbbrevLabel(scaleType: string): string {
  if (isWorkshopScaleType(scaleType)) {
    return SCALE_TYPE_ABBREV[scaleType]
  }

  return scaleType
}

export const MIXED_VALUE = '__mixed__'

export function globalSelectValue(values: string[], fallback: string): string {
  if (values.length === 0) {
    return fallback
  }

  const first = values[0]
  return values.every((value) => value === first) ? first : MIXED_VALUE
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

export function gridScaleRows(
  tonality: PatternTonality,
  octaveShift: number,
): GridScaleRow[] {
  return gridScaleStepsHighToLow().map((scaleStep) => ({
    scaleStep,
    stepLabel: formatScaleStepLabel(scaleStep),
    pitchName: stepToPitch(tonality, scaleStep, octaveShift),
  }))
}

export type ResolvedPatternNote = PatternNote & { pitch: string }

export function resolvePatternNotes(
  pattern: Pick<LoopPattern, 'notes' | 'root' | 'scale' | 'octaveShift'>,
): ResolvedPatternNote[] {
  const tonality = { root: pattern.root, scale: pattern.scale }
  return pattern.notes.map((note) => ({
    ...note,
    pitch: stepToPitch(tonality, note.scaleStep, pattern.octaveShift),
  }))
}

export function clampOctaveShift(shift: number): number {
  return Math.min(OCTAVE_SHIFT_MAX, Math.max(OCTAVE_SHIFT_MIN, shift))
}

export function isGridScaleStep(scaleStep: number): boolean {
  return scaleStep >= GRID_SCALE_STEP_MIN && scaleStep <= GRID_SCALE_STEP_MAX
}
