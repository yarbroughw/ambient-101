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
      '../ensembles/workshop-starter.json': templateBody(),
    })

    expect(templates).toHaveLength(1)
    expect(templates[0]?.id).toBe('workshop-starter')
    expect(templates[0]?.loops.map((loop) => loop.label)).toEqual(['scale'])
  })

  it('sorts templates by label', () => {
    const templates = loadEnsembleTemplatesFromModules({
      '../ensembles/b.json': templateBody({ label: 'beta' }),
      '../ensembles/a.json': templateBody({ label: 'alpha' }),
    })

    expect(templates.map((template) => template.label)).toEqual(['alpha', 'beta'])
  })

  it('rejects templates whose embedded reels fail to parse', () => {
    const templates = loadEnsembleTemplatesFromModules({
      '../ensembles/missing-loops.json': { ...templateBody(), loops: undefined },
      '../ensembles/bad-loop.json': templateBody({ loops: [{ label: 'broken' }] }),
    })

    expect(templates).toEqual([])
  })
})

describe('ensembleTemplates', () => {
  it('defines at least one starter template', () => {
    expect(ENSEMBLE_TEMPLATES.length).toBeGreaterThan(0)
  })

  it('instantiates workshop starter with the scale exercise reel', () => {
    const { loops, paceScale, suggestedName } =
      instantiateEnsembleTemplate('workshop-starter')

    expect(suggestedName).toBe('workshop starter')
    expect(paceScale).toBe(1)
    expect(loops.map((loop) => loop.label)).toEqual(['scale'])
    expect(loops[0]?.notes.length).toBeGreaterThan(0)
  })

  it('dedupes ids and labels across embedded reels', () => {
    const [template] = loadEnsembleTemplatesFromModules({
      '../ensembles/dupes.json': templateBody({
        loops: [
          createTestPattern({ id: 'scale', label: 'scale' }),
          createTestPattern({ id: 'scale', label: 'scale' }),
        ],
      }),
    })
    expect(template?.loops).toHaveLength(2)
  })
})
