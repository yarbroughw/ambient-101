export const INSTRUMENT_IDS = [
  'pad',
  'pluck',
  'bass',
  'bell',
  'organ',
  'keys',
  'glass',
  'strings',
  'reed',
  'marimba',
  'harp',
  'gong',
  'brass',
] as const

export type InstrumentId = (typeof INSTRUMENT_IDS)[number]

export const DEFAULT_INSTRUMENT: InstrumentId = 'pluck'

export function isInstrumentId(value: string): value is InstrumentId {
  return (INSTRUMENT_IDS as readonly string[]).includes(value)
}

const LEGACY_INSTRUMENT_ALIASES: Record<string, InstrumentId> = {
  mallet: 'keys',
  // koto was a Karplus-Strong pluck voice, removed with the pluck synth kind.
  // The new harp is its closest surviving timbre.
  koto: 'harp',
}

export function normalizeInstrument(value: string): InstrumentId {
  if (isInstrumentId(value)) {
    return value
  }
  return LEGACY_INSTRUMENT_ALIASES[value] ?? DEFAULT_INSTRUMENT
}
