import { describe, expect, it } from 'vitest'
import {
  ENSEMBLE_TEMPLATES,
  instantiateEnsembleTemplate,
} from './ensembleTemplates'

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
