import { describe, expect, it } from 'vitest'
import {
  ENSEMBLE_TEMPLATES,
  instantiateEnsembleTemplate,
  loadEnsembleTemplatesFromModules,
} from './ensembleTemplates'

describe('loadEnsembleTemplatesFromModules', () => {
  it('loads templates from JSON modules keyed by filename', () => {
    const templates = loadEnsembleTemplatesFromModules({
      '../ensembles/workshop-starter.json': {
        label: 'workshop starter',
        description: 'a scale exercise reel to start tinkering with',
        suggestedName: 'workshop starter',
        presetIds: ['scale'],
      },
    })

    expect(templates).toEqual([
      {
        id: 'workshop-starter',
        label: 'workshop starter',
        description: 'a scale exercise reel to start tinkering with',
        suggestedName: 'workshop starter',
        presetIds: ['scale'],
        paceScale: undefined,
      },
    ])
  })

  it('sorts templates by label', () => {
    const templates = loadEnsembleTemplatesFromModules({
      '../ensembles/b.json': {
        label: 'beta',
        description: '',
        suggestedName: 'beta',
      },
      '../ensembles/a.json': {
        label: 'alpha',
        description: '',
        suggestedName: 'alpha',
      },
    })

    expect(templates.map((template) => template.label)).toEqual(['alpha', 'beta'])
  })

  it('skips invalid template files', () => {
    const templates = loadEnsembleTemplatesFromModules({
      '../ensembles/broken.json': { label: 'broken' },
      '../ensembles/bad-presets.json': {
        label: 'bad',
        description: '',
        suggestedName: 'bad',
        presetIds: [1, 2],
      },
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
})
