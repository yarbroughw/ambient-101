import { DEFAULT_PACE_SCALE } from '../lib/globalPace'
import type { LoopPattern } from './patternTypes'
import {
  createPresetPattern,
  nextAvailableIdAndLabel,
  type LoopPresetId,
} from './demoPatterns'

export type EnsembleTemplateId = 'workshop-starter'

export type EnsembleTemplate = {
  id: EnsembleTemplateId
  label: string
  description: string
  suggestedName: string
  paceScale?: number
}

export const ENSEMBLE_TEMPLATES: EnsembleTemplate[] = [
  {
    id: 'workshop-starter',
    label: 'workshop starter',
    description: 'bass plus two melody reels',
    suggestedName: 'workshop starter',
  },
]

const WORKSHOP_REELS: Array<{ presetId: LoopPresetId; suggestedLabel: string }> =
  [
    { presetId: 'bass', suggestedLabel: 'bass' },
    { presetId: 'melody1', suggestedLabel: 'melody1' },
    { presetId: 'melody2', suggestedLabel: 'melody2' },
  ]

function instantiateWorkshopStarter(): LoopPattern[] {
  const loops: LoopPattern[] = []

  for (const reel of WORKSHOP_REELS) {
    const { id, label } = nextAvailableIdAndLabel(
      reel.suggestedLabel,
      loops.map((pattern) => ({ pattern })),
    )
    loops.push(createPresetPattern(reel.presetId, id, label))
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

  const loops =
    templateId === 'workshop-starter' ? instantiateWorkshopStarter() : []

  return {
    loops,
    paceScale: template.paceScale ?? DEFAULT_PACE_SCALE,
    suggestedName: template.suggestedName,
  }
}
