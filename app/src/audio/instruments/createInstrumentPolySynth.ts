import * as Tone from 'tone'
import { PluckPolySynth } from './pluckPolySynth'
import { INSTRUMENT_RECIPES } from './recipes'
import type { InstrumentId } from './types'

export type InstrumentPolySynth = Tone.PolySynth | PluckPolySynth

export function createInstrumentPolySynth(instrument: InstrumentId): InstrumentPolySynth {
  const recipe = INSTRUMENT_RECIPES[instrument]

  switch (recipe.kind) {
    case 'fm': {
      const synth = new Tone.PolySynth(Tone.FMSynth)
      synth.set(recipe.options as Tone.FMSynthOptions)
      return synth
    }
    case 'pluck': {
      // PluckSynth is not Monophonic, so Tone.PolySynth cannot voice it.
      return new PluckPolySynth(recipe.options)
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
