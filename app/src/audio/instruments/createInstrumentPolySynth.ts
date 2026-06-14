import * as Tone from 'tone'
import { INSTRUMENT_RECIPES } from './recipes'
import type { InstrumentId } from './types'

export type InstrumentPolySynth = Tone.PolySynth<any>

export function createInstrumentPolySynth(instrument: InstrumentId): InstrumentPolySynth {
  const recipe = INSTRUMENT_RECIPES[instrument]

  switch (recipe.kind) {
    case 'fm': {
      const synth = new Tone.PolySynth(Tone.FMSynth)
      synth.set(recipe.options as Tone.FMSynthOptions)
      return synth
    }
    case 'am': {
      const synth = new Tone.PolySynth(Tone.AMSynth)
      synth.set(recipe.options as Tone.AMSynthOptions)
      return synth
    }
    case 'duo': {
      const synth = new Tone.PolySynth(Tone.DuoSynth)
      synth.set(recipe.options as Tone.DuoSynthOptions)
      return synth
    }
    default: {
      const synth = new Tone.PolySynth(Tone.Synth)
      synth.set(recipe.options as Tone.SynthOptions)
      return synth
    }
  }
}

export function instrumentOutputGain(instrument: InstrumentId): number {
  return INSTRUMENT_RECIPES[instrument].outputGain
}

export function instrumentPreviewGain(instrument: InstrumentId): number {
  return INSTRUMENT_RECIPES[instrument].previewGain
}

export function instrumentFilterFrequency(instrument: InstrumentId): number {
  return INSTRUMENT_RECIPES[instrument].filterFrequency
}

/** Recipe default amplitude attack/release, used as the dial baseline when a
 * reel has no envelope override. The envelope lives in different places per
 * synth kind. */
export function instrumentEnvelope(instrument: InstrumentId): {
  attack: number
  release: number
} {
  const recipe = INSTRUMENT_RECIPES[instrument]
  const envelope =
    recipe.kind === 'duo' ? recipe.options.voice0.envelope : recipe.options.envelope
  return { attack: envelope.attack, release: envelope.release }
}
