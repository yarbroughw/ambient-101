export const PALETTE_IDS = [
  'default',
  'legacy',
  'dusk',
  'grove',
  'twilight',
  'midnight',
  'deep',
  'haze',
  'slate',
  'void',
] as const

export type PaletteId = (typeof PALETTE_IDS)[number]

export type PaletteOption = {
  id: PaletteId
  label: string
  hint: string
}

export const PALETTE_OPTIONS: PaletteOption[] = [
  {
    id: 'default',
    label: 'default',
    hint: 'Twilight sky — cool canvas, warm tape, cyclical calm',
  },
  {
    id: 'legacy',
    label: 'legacy',
    hint: 'Workshop original — warm tape on cool gray',
  },
  {
    id: 'dusk',
    label: 'dusk',
    hint: 'Mauve dusk and periwinkle — soft, reflective',
  },
  {
    id: 'grove',
    label: 'grove',
    hint: 'Moss and linen — grounded, organic cycles',
  },
  {
    id: 'twilight',
    label: 'twilight',
    hint: 'Dim violet-gray — day ending, loops still turning',
  },
  {
    id: 'midnight',
    label: 'midnight',
    hint: 'Blue-black night — quiet orbit, cyan sparks',
  },
  {
    id: 'deep',
    label: 'deep',
    hint: 'Abyssal teal — pressure, depth, slow cycles',
  },
  {
    id: 'haze',
    label: 'haze',
    hint: 'Smoky plum — meditative, soft focus',
  },
  {
    id: 'slate',
    label: 'slate',
    hint: 'Neutral dark UI — clear controls, calm field',
  },
  {
    id: 'void',
    label: 'void',
    hint: 'Near-black minimal — violet signal in the dark',
  },
]

export function isPaletteId(value: string): value is PaletteId {
  return PALETTE_IDS.includes(value as PaletteId)
}

export function applyPalette(id: PaletteId): void {
  if (id === 'default') {
    delete document.documentElement.dataset.palette
    return
  }

  document.documentElement.dataset.palette = id
}

export function migrateStoredPaletteId(stored: string): PaletteId | null {
  if (stored === 'orbit') {
    return 'default'
  }

  if (isPaletteId(stored)) {
    return stored
  }

  return null
}
