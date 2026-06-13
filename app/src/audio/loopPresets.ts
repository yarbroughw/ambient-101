import { patternFitsGrid } from '../lib/gridLayout'
import { parseLoopPresetBody } from '../lib/loopStorage'
import { instantiatePatternFromTemplate } from './demoPatterns'
import type { LoopPattern } from './patternTypes'

export type LoopPreset = {
  id: string
  label: string
  template: Omit<LoopPattern, 'id' | 'label'>
}

const presetModules = import.meta.glob('../presets/reels/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

function presetIdFromPath(path: string): string {
  const match = path.match(/\/([^/]+)\.json$/)
  return match?.[1] ?? path
}

export function loadLoopPresetsFromModules(
  modules: Record<string, unknown>,
): LoopPreset[] {
  const presets: LoopPreset[] = []

  for (const [path, data] of Object.entries(modules)) {
    const id = presetIdFromPath(path)
    const pattern = parseLoopPresetBody(data, id, id)
    if (!pattern) {
      console.warn(`Skipping invalid loop preset "${id}"`)
      continue
    }

    if (!patternFitsGrid(pattern)) {
      throw new Error(`Loop preset "${id}" exceeds grid bounds`)
    }

    const { id: _id, label, ...template } = pattern
    presets.push({
      id,
      label,
      template: {
        ...template,
        notes: template.notes.map((note) => ({ ...note })),
      },
    })
  }

  return presets.sort((a, b) => a.label.localeCompare(b.label))
}

const LOADED_PRESETS = loadLoopPresetsFromModules(presetModules)
const PRESET_BY_ID = new Map(LOADED_PRESETS.map((preset) => [preset.id, preset]))

export const LOOP_PRESETS = LOADED_PRESETS.map(({ id, label }) => ({ id, label }))

export function getLoopPreset(presetId: string): LoopPreset | undefined {
  return PRESET_BY_ID.get(presetId)
}

export function createPatternFromPreset(
  presetId: string,
  id: string,
  label: string,
): LoopPattern {
  const preset = getLoopPreset(presetId)
  if (!preset) {
    throw new Error(`Unknown loop preset "${presetId}"`)
  }

  return instantiatePatternFromTemplate(preset.template, id, label)
}
