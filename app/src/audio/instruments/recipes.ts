import type { InstrumentId } from './types'

type BaseRecipe = {
  filterFrequency: number
  outputGain: number
  previewGain: number
}

type SynthInstrumentRecipe = BaseRecipe & {
  kind: 'synth'
  options: {
    oscillator: { type: 'sawtooth' | 'square' | 'triangle' | 'sine' }
    envelope: {
      attack: number
      decay: number
      sustain: number
      release: number
    }
    volume: number
  }
}

type FmInstrumentRecipe = BaseRecipe & {
  kind: 'fm'
  options: {
    harmonicity: number
    modulationIndex: number
    oscillator: { type: 'sine' }
    envelope: {
      attack: number
      decay: number
      sustain: number
      release: number
    }
    modulation: { type: 'sine' }
    modulationEnvelope: {
      attack: number
      decay: number
      sustain: number
      release: number
    }
    volume: number
  }
}

type PluckInstrumentRecipe = BaseRecipe & {
  kind: 'pluck'
  options: {
    attackNoise: number
    dampening: number
    resonance: number
    hold: number
    release: number
    volume: number
  }
}

export type InstrumentRecipe =
  | SynthInstrumentRecipe
  | FmInstrumentRecipe
  | PluckInstrumentRecipe

export const INSTRUMENT_RECIPES: Record<InstrumentId, InstrumentRecipe> = {
  pad: {
    kind: 'synth',
    options: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 1, decay: 1, sustain: 0.7, release: 4 },
      volume: -8,
    },
    filterFrequency: 2000,
    outputGain: 0.55,
    previewGain: 0.55,
  },
  pluck: {
    kind: 'synth',
    options: {
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.8, sustain: 0.25, release: 1.5 },
      volume: -10,
    },
    filterFrequency: 1200,
    outputGain: 0.5,
    previewGain: 0.5,
  },
  bass: {
    kind: 'synth',
    options: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.35, sustain: 0.65, release: 2.5 },
      volume: -6,
    },
    filterFrequency: 520,
    outputGain: 0.55,
    previewGain: 0.52,
  },
  bell: {
    kind: 'fm',
    options: {
      harmonicity: 4.5,
      modulationIndex: 14,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 1.8, sustain: 0.05, release: 2.2 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.002, decay: 0.4, sustain: 0, release: 0.6 },
      volume: -7,
    },
    filterFrequency: 4800,
    outputGain: 0.52,
    previewGain: 0.48,
  },
  organ: {
    kind: 'synth',
    options: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.08, sustain: 1, release: 0.35 },
      volume: -10,
    },
    filterFrequency: 2600,
    outputGain: 0.48,
    previewGain: 0.46,
  },
  keys: {
    kind: 'fm',
    options: {
      harmonicity: 3,
      modulationIndex: 7,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 1.4, sustain: 0, release: 1.6 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 0.5 },
      volume: -8,
    },
    filterFrequency: 3800,
    outputGain: 0.5,
    previewGain: 0.48,
  },
  glass: {
    kind: 'synth',
    options: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.06, decay: 0.6, sustain: 0.35, release: 2.4 },
      volume: -9,
    },
    filterFrequency: 4200,
    outputGain: 0.46,
    previewGain: 0.44,
  },
}
