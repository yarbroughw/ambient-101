import { describe, expect, it } from 'vitest'
import { INSTRUMENT_IDS, isInstrumentId, normalizeInstrument } from './types'
import { INSTRUMENT_RECIPES } from './recipes'

describe('instrument ids', () => {
  it('no longer includes koto', () => {
    expect(isInstrumentId('koto')).toBe(false)
    expect(INSTRUMENT_IDS).not.toContain('koto')
  })

  it('maps the legacy koto id to harp', () => {
    expect(normalizeInstrument('koto')).toBe('harp')
  })

  it('still recognises harp', () => {
    expect(isInstrumentId('harp')).toBe(true)
  })
})

describe('instrument recipes', () => {
  it('defines a recipe for every instrument id', () => {
    for (const id of INSTRUMENT_IDS) {
      expect(INSTRUMENT_RECIPES[id]).toBeDefined()
    }
  })

  it('harp is now an ADSR-compatible synth voice', () => {
    const harp = INSTRUMENT_RECIPES.harp
    expect(harp.kind).toBe('synth')
    if (harp.kind === 'synth') {
      expect(harp.options.envelope).toMatchObject({
        attack: expect.any(Number),
        release: expect.any(Number),
      })
    }
  })

  it('no recipe uses the removed pluck kind', () => {
    for (const id of INSTRUMENT_IDS) {
      expect(INSTRUMENT_RECIPES[id].kind).not.toBe('pluck')
    }
  })
})
