import { DEFAULT_PACE_SCALE } from '../lib/globalPace'
import type { LoopPattern } from './patternTypes'
import { createPatternFromPreset, getLoopPreset } from './loopPresets'
import { nextAvailableIdAndLabel } from './demoPatterns'

export type EnsembleTemplateId = 'workshop-starter'

export type EnsembleTemplate = {
  id: EnsembleTemplateId
  label: string
  description: string
  suggestedName: string
  paceScale?: number
  presetIds?: string[]
}

export const ENSEMBLE_TEMPLATES: EnsembleTemplate[] = [
  {
    id: 'workshop-starter',
    label: 'workshop starter',
    description: 'blank ensemble',
    suggestedName: 'workshop starter',
    presetIds: [],
  },
]

function instantiateFromPresetIds(presetIds: string[]): LoopPattern[] {
  const loops: LoopPattern[] = []

  for (const presetId of presetIds) {
    const preset = getLoopPreset(presetId)
    if (!preset) {
      throw new Error(`Ensemble template references unknown preset "${presetId}"`)
    }

    const { id, label } = nextAvailableIdAndLabel(
      preset.label,
      loops.map((pattern) => ({ pattern })),
    )
    loops.push(createPatternFromPreset(presetId, id, label))
  }

  return loops
}

export function instantiateEnsembleTemplate(templateId: EnsembleTemplateId): {
  loops: LoopPattern[]
  paceScale: number
  suggestedName: string
} {
  const template = ENSEMBLE_TEMPLATES.find((entry) => entry.id === templateId)
  if (!template) {
    throw new Error(`Unknown ensemble template "${templateId}"`)
  }

  const loops = instantiateFromPresetIds(template.presetIds ?? [])

  return {
    loops,
    paceScale: template.paceScale ?? DEFAULT_PACE_SCALE,
    suggestedName: template.suggestedName,
  }
}
