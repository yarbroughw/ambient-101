import { describe, expect, it } from 'vitest'
import {
  ENSEMBLE_TEMPLATES,
  instantiateEnsembleTemplate,
  loadEnsembleTemplatesFromModules,
} from './ensembleTemplates'
import { createTestPattern } from '../test/fixtures'

function templateBody(overrides: Record<string, unknown> = {}) {
  return {
    label: 'starter',
    description: 'a starter ensemble',
    suggestedName: 'starter',
    loops: [createTestPattern({ id: 'scale', label: 'scale' })],
    ...overrides,
  }
}

describe('loadEnsembleTemplatesFromModules', () => {
  it('loads templates from JSON modules keyed by filename', () => {
    const templates = loadEnsembleTemplatesFromModules({
      '../presets/ensembles/starter.json': templateBody(),
    })

    expect(templates).toHaveLength(1)
    expect(templates[0]?.id).toBe('starter')
    expect(templates[0]?.loops.map((loop) => loop.label)).toEqual(['scale'])
  })

  it('sorts templates by label', () => {
    const templates = loadEnsembleTemplatesFromModules({
      '../presets/ensembles/b.json': templateBody({ label: 'beta' }),
      '../presets/ensembles/a.json': templateBody({ label: 'alpha' }),
    })

    expect(templates.map((template) => template.label)).toEqual(['alpha', 'beta'])
  })

  it('accepts an exported ensemble, using its name as label and suggested name', () => {
    const templates = loadEnsembleTemplatesFromModules({
      '../presets/ensembles/airports.json': {
        version: 1,
        name: 'airports',
        paceScale: 1,
        loops: [createTestPattern({ id: 'loop', label: 'loop' })],
      },
    })

    expect(templates).toHaveLength(1)
    expect(templates[0]?.label).toBe('airports')
    expect(templates[0]?.suggestedName).toBe('airports')
    expect(templates[0]?.description).toBe('')
  })

  it('rejects templates whose embedded reels fail to parse', () => {
    const templates = loadEnsembleTemplatesFromModules({
      '../presets/ensembles/missing-loops.json': { ...templateBody(), loops: undefined },
      '../presets/ensembles/bad-loop.json': templateBody({ loops: [{ label: 'broken' }] }),
    })

    expect(templates).toEqual([])
  })
})

describe('ensembleTemplates', () => {
  it('defines at least one starter template', () => {
    expect(ENSEMBLE_TEMPLATES.length).toBeGreaterThan(0)
  })

  it('instantiates airports from the bundled preset', () => {
    const { loops, paceScale, suggestedName } =
      instantiateEnsembleTemplate('airports')

    expect(suggestedName).toBe('airports')
    expect(paceScale).toBe(1)
    expect(loops.length).toBeGreaterThan(0)
    expect(loops[0]?.notes.length).toBeGreaterThan(0)
  })
})
