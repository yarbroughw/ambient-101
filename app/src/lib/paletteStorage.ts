import {
  applyPalette,
  migrateStoredPaletteId,
  type PaletteId,
} from './palettes'

const STORAGE_KEY = 'ambient-101:palette'

export function loadPaletteId(): PaletteId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const migrated = migrateStoredPaletteId(stored)
      if (migrated) {
        return migrated
      }
    }
  } catch {
    // ignore quota / privacy mode
  }

  return 'default'
}

export function savePaletteId(id: PaletteId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // ignore quota / privacy mode
  }
}

export function initPaletteFromStorage(): PaletteId {
  const id = loadPaletteId()
  applyPalette(id)
  return id
}
