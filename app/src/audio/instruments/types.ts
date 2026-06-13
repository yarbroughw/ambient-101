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
  'koto',
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
}

export function normalizeInstrument(value: string): InstrumentId {
  if (isInstrumentId(value)) {
    return value
  }
  return LEGACY_INSTRUMENT_ALIASES[value] ?? DEFAULT_INSTRUMENT
}
