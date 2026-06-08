import { describe, expect, it } from 'vitest'
import {
  ENSEMBLE_TEMPLATES,
  instantiateEnsembleTemplate,
} from './ensembleTemplates'
import { patternFitsGrid } from '../lib/gridLayout'

describe('ensembleTemplates', () => {
  it('defines at least one starter template', () => {
    expect(ENSEMBLE_TEMPLATES.length).toBeGreaterThan(0)
  })

  it('instantiates grid-safe workshop starter reels', () => {
    const { loops, paceScale, suggestedName } =
      instantiateEnsembleTemplate('workshop-starter')

    expect(suggestedName).toBe('workshop starter')
    expect(paceScale).toBe(1)
    expect(loops).toHaveLength(3)
    expect(loops.map((pattern) => pattern.label)).toEqual([
      'bass',
      'melody1',
      'melody2',
    ])
    expect(loops.every((pattern) => patternFitsGrid(pattern))).toBe(true)
  })
})
