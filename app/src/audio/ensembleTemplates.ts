import { DEFAULT_PACE_SCALE } from '../lib/globalPace'
import { parseLoopPatternsValue } from '../lib/loopStorage'
import type { LoopPattern } from './patternTypes'
import { nextAvailableIdAndLabel } from './demoPatterns'

export type EnsembleTemplateId = string

export type EnsembleTemplate = {
  id: EnsembleTemplateId
  label: string
  description: string
  suggestedName: string
  paceScale?: number
  loops: LoopPattern[]
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
  if (!Array.isArray(body.loops)) {
    return null
  }

  const loops = parseLoopPatternsValue(body.loops)
  // Reject the template outright if any embedded reel fails to parse, rather
  // than silently dropping reels and instantiating a partial ensemble.
  if (loops.length !== body.loops.length) {
    return null
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
    paceScale,
    loops,
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

// Embedded reels carry their authored labels; reassign fresh ids and dedupe
// labels so a freshly instantiated ensemble has no collisions.
function instantiateLoops(loops: LoopPattern[]): LoopPattern[] {
  const result: LoopPattern[] = []

  for (const loop of loops) {
    const { id, label } = nextAvailableIdAndLabel(
      loop.label,
      result.map((pattern) => ({ pattern })),
    )
    result.push({
      ...loop,
      id,
      label,
      notes: loop.notes.map((note) => ({ ...note })),
    })
  }

  return result
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

  return {
    loops: instantiateLoops(template.loops),
    paceScale: template.paceScale ?? DEFAULT_PACE_SCALE,
    suggestedName: template.suggestedName,
  }
}
