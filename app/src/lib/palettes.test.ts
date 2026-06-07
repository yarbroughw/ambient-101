import { describe, expect, it } from 'vitest'
import { isPaletteId, migrateStoredPaletteId } from './palettes'

describe('isPaletteId', () => {
  it('accepts known palette ids', () => {
    expect(isPaletteId('default')).toBe(true)
    expect(isPaletteId('midnight')).toBe(true)
  })

  it('rejects unknown values', () => {
    expect(isPaletteId('orbit')).toBe(false)
    expect(isPaletteId('')).toBe(false)
  })
})

describe('migrateStoredPaletteId', () => {
  it('maps legacy orbit palette to default', () => {
    expect(migrateStoredPaletteId('orbit')).toBe('default')
  })

  it('returns valid palette ids unchanged', () => {
    expect(migrateStoredPaletteId('grove')).toBe('grove')
  })

  it('returns null for unknown stored values', () => {
    expect(migrateStoredPaletteId('unknown')).toBeNull()
  })
})
