import { describe, expect, it } from 'vitest'
import { LOOP_DELAY_DEFAULT, LOOP_REVERB_DEFAULT } from './loopEffects'
import {
  createPatternFromPreset,
  loadLoopPresetsFromModules,
} from './loopPresets'
import { createTestPattern } from '../test/fixtures'

describe('loadLoopPresetsFromModules', () => {
  it('loads presets from JSON modules keyed by filename', () => {
    const body = createTestPattern({
      label: 'warm pad',
      notes: [{ scaleStep: 0, startCol: 0, spanCols: 2, velocity: 0.5 }],
    })
    const { id: _id, label: _label, ...template } = body

    const presets = loadLoopPresetsFromModules({
      '../presets/warm-pad.json': template,
    })

    expect(presets).toEqual([
      {
        id: 'warm-pad',
        label: 'warm-pad',
        template: {
          loopDuration: 11,
          bpm: 96,
          root: 'C',
          scale: 'minor',
          octaveShift: 0,
          instrument: 'pad',
          volume: 1,
          reverb: LOOP_REVERB_DEFAULT,
          delay: LOOP_DELAY_DEFAULT,
          notes: [{ scaleStep: 0, startCol: 0, spanCols: 2, velocity: 0.5 }],
        },
      },
    ])
  })

  it('uses the JSON label when provided', () => {
    const presets = loadLoopPresetsFromModules({
      '../presets/drone.json': {
        label: 'low drone',
        loopDuration: 12,
        bpm: 60,
        root: 'C',
        scale: 'minor',
        octaveShift: -1,
        instrument: 'pad',
        volume: 0.8,
        reverb: LOOP_REVERB_DEFAULT,
        delay: LOOP_DELAY_DEFAULT,
        notes: [],
      },
    })

    expect(presets[0]?.label).toBe('low drone')
  })

  it('skips invalid preset files', () => {
    const presets = loadLoopPresetsFromModules({
      '../presets/broken.json': { label: 'broken' },
    })

    expect(presets).toEqual([])
  })
})

describe('createPatternFromPreset', () => {
  it('throws when the preset id is not loaded', () => {
    expect(() =>
      createPatternFromPreset('missing', 'missing', 'missing'),
    ).toThrow('Unknown loop preset "missing"')
  })
})
