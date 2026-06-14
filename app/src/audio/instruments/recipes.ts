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

type AmInstrumentRecipe = BaseRecipe & {
  kind: 'am'
  options: {
    harmonicity: number
    oscillator: { type: 'sine' | 'triangle' }
    envelope: {
      attack: number
      decay: number
      sustain: number
      release: number
    }
    modulation: { type: 'sine' | 'square' }
    modulationEnvelope: {
      attack: number
      decay: number
      sustain: number
      release: number
    }
    volume: number
  }
}

type DuoVoiceRecipe = {
  oscillator: { type: 'sawtooth' | 'square' | 'triangle' | 'sine' }
  envelope: {
    attack: number
    decay: number
    sustain: number
    release: number
  }
}

type DuoInstrumentRecipe = BaseRecipe & {
  kind: 'duo'
  options: {
    harmonicity: number
    vibratoAmount: number
    vibratoRate: number
    voice0: DuoVoiceRecipe
    voice1: DuoVoiceRecipe
    volume: number
  }
}

export type InstrumentRecipe =
  | SynthInstrumentRecipe
  | FmInstrumentRecipe
  | AmInstrumentRecipe
  | DuoInstrumentRecipe

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
      volume: -6,
    },
    filterFrequency: 3800,
    outputGain: 0.55,
    previewGain: 0.54,
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
  // Lush detuned saw pair. Two sustained voices stack, so it is kept well
  // below the percussive voices to avoid dominating a layered ensemble.
  strings: {
    kind: 'duo',
    options: {
      harmonicity: 1.005,
      vibratoAmount: 0.08,
      vibratoRate: 4.5,
      voice0: {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.3, decay: 0.2, sustain: 0.85, release: 2.5 },
      },
      voice1: {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.4, decay: 0.2, sustain: 0.85, release: 2.8 },
      },
      volume: -12,
    },
    filterFrequency: 2200,
    outputGain: 0.42,
    previewGain: 0.42,
  },
  // Hollow, reedy sustained tone (clarinet-ish) via amplitude modulation.
  reed: {
    kind: 'am',
    options: {
      harmonicity: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.08, decay: 0.2, sustain: 0.85, release: 0.6 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.05, decay: 0.1, sustain: 0.6, release: 0.4 },
      volume: 0,
    },
    filterFrequency: 2400,
    outputGain: 0.5,
    previewGain: 0.49,
  },
  // Woody, short FM mallet. Integer harmonicity keeps it harmonic.
  marimba: {
    kind: 'fm',
    options: {
      harmonicity: 1,
      modulationIndex: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
      volume: -5,
    },
    filterFrequency: 2200,
    outputGain: 0.52,
    previewGain: 0.52,
  },
  // Warm plucked-string with a long ring: fast attack, no sustain, long
  // decay/release tail. Triangle keeps it softer than the square-wave pluck and
  // it rings far longer than glass, so it reads as a harp rather than either.
  harp: {
    kind: 'synth',
    options: {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.005, decay: 1.8, sustain: 0, release: 2.2 },
      volume: -9,
    },
    filterFrequency: 3500,
    outputGain: 0.5,
    previewGain: 0.5,
  },
  // Dark, inharmonic, long-decaying metallic FM tone. Long tails accumulate
  // energy across a loop, so it is held quieter than the bell.
  gong: {
    kind: 'fm',
    options: {
      harmonicity: 3.3,
      modulationIndex: 18,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.002, decay: 3, sustain: 0, release: 3 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.002, decay: 1.5, sustain: 0, release: 1.5 },
      volume: -6,
    },
    filterFrequency: 3000,
    outputGain: 0.46,
    previewGain: 0.44,
  },
  // Bright sustained FM brass; modulation sustains so the tone stays brassy.
  brass: {
    kind: 'fm',
    options: {
      harmonicity: 1,
      modulationIndex: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.15, decay: 0.2, sustain: 0.8, release: 0.6 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.2, decay: 0.2, sustain: 0.7, release: 0.5 },
      volume: -5,
    },
    filterFrequency: 2600,
    outputGain: 0.48,
    previewGain: 0.47,
  },
}
