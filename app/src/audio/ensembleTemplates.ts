import { DEFAULT_PACE_SCALE } from '../lib/globalPace'
import type { LoopPattern } from './patternTypes'
import { createPatternFromPreset, getLoopPreset } from './loopPresets'
import { nextAvailableIdAndLabel } from './demoPatterns'

export type EnsembleTemplateId = string

export type EnsembleTemplate = {
  id: EnsembleTemplateId
  label: string
  description: string
  suggestedName: string
  paceScale?: number
  presetIds?: string[]
}

const templateModules = import.meta.glob('../ensembles/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

function templateIdFromPath(path: string): string {
  const match = path.match(/\/([^/]+)\.json$/)
  return match?.[1] ?? path
}

export function parseEnsembleTemplateBody(
  data: unknown,
  id: string,
): EnsembleTemplate | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  const body = data as Record<string, unknown>
  if (typeof body.label !== 'string' || body.label.length === 0) {
    return null
  }
  if (typeof body.suggestedName !== 'string' || body.suggestedName.length === 0) {
    return null
  }
  if (typeof body.description !== 'string') {
    return null
  }

  let presetIds: string[] | undefined
  if (body.presetIds !== undefined) {
    if (
      !Array.isArray(body.presetIds) ||
      !body.presetIds.every((entry) => typeof entry === 'string')
    ) {
      return null
    }
    presetIds = [...body.presetIds]
  }

  let paceScale: number | undefined
  if (body.paceScale !== undefined) {
    if (typeof body.paceScale !== 'number' || !Number.isFinite(body.paceScale)) {
      return null
    }
    paceScale = body.paceScale
  }

  return {
    id,
    label: body.label,
    description: body.description,
    suggestedName: body.suggestedName,
    presetIds,
    paceScale,
  }
}

export function loadEnsembleTemplatesFromModules(
  modules: Record<string, unknown>,
): EnsembleTemplate[] {
  const templates: EnsembleTemplate[] = []

  for (const [path, data] of Object.entries(modules)) {
    const id = templateIdFromPath(path)
    const template = parseEnsembleTemplateBody(data, id)
    if (!template) {
      console.warn(`Skipping invalid ensemble template "${id}"`)
      continue
    }

    templates.push(template)
  }

  return templates.sort((a, b) => a.label.localeCompare(b.label))
}

const LOADED_TEMPLATES = loadEnsembleTemplatesFromModules(templateModules)
const TEMPLATE_BY_ID = new Map(
  LOADED_TEMPLATES.map((template) => [template.id, template]),
)

export const ENSEMBLE_TEMPLATES = LOADED_TEMPLATES

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
  const template = TEMPLATE_BY_ID.get(templateId)
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
