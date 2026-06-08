import * as Tone from 'tone'
import {
  createLoopEffectsBus,
  LOOP_DELAY_DEFAULT,
  LOOP_REVERB_DEFAULT,
  type LoopEffectsBus,
} from './loopEffects'
import { INSTRUMENT_RECIPES } from './instruments/recipes'
import {
  createInstrumentPolySynth,
  instrumentOutputGain,
  type InstrumentPolySynth,
} from './instruments/createInstrumentPolySynth'
import { normalizeInstrument, type InstrumentId } from './instruments/types'
import type { NoteSink } from './types'

type SynthChain = {
  synth: InstrumentPolySynth
  filter: Tone.Filter
  gain: Tone.Gain
  meter: Tone.Meter
}

function buildSynthChain(
  instrument: InstrumentId,
  destination: Tone.InputNode,
): SynthChain {
  const recipe = INSTRUMENT_RECIPES[instrument]
  const synth = createInstrumentPolySynth(instrument)

  const filter = new Tone.Filter({
    frequency: recipe.filterFrequency,
    type: 'lowpass',
    rolloff: -12,
  })
  const gain = new Tone.Gain(instrumentOutputGain(instrument))
  const meter = new Tone.Meter({ normalRange: true, smoothing: 0.45 })

  synth.connect(filter)
  filter.connect(gain)
  gain.connect(meter)
  meter.connect(destination)

  return { synth, filter, gain, meter }
}

export type LoopVoice = {
  sink: NoteSink
  silence: () => void
  prepare: () => void
  getLevel: () => number
  setVolume: (amount: number) => void
  getVolume: () => number
  setReverb: (amount: number) => void
  setDelay: (amount: number) => void
}

function readMeterLevel(meter: Tone.Meter): number {
  const value = meter.getValue()
  return typeof value === 'number' ? value : 0
}

export function createSynthNoteSink(synth: InstrumentPolySynth): NoteSink {
  return {
    triggerAttackRelease(note, duration, time, velocity = 1) {
      synth.triggerAttackRelease(note, duration, time, velocity)
    },
  }
}

export function createLoopVoiceForInstrument(
  instrument: string,
  reverb = LOOP_REVERB_DEFAULT,
  delay = LOOP_DELAY_DEFAULT,
): LoopVoice {
  const instrumentId = normalizeInstrument(instrument)
  let effects: LoopEffectsBus | null = createLoopEffectsBus(reverb, delay)
  let chain: SynthChain | null = buildSynthChain(instrumentId, effects.input)
  let sink = createSynthNoteSink(chain.synth)
  let volume = 1
  let reverbAmount = reverb
  let delayAmount = delay

  function applyVolume() {
    if (!chain) {
      return
    }

    const t = Tone.now()
    chain.gain.gain.cancelScheduledValues(t)
    chain.gain.gain.rampTo(instrumentOutputGain(instrumentId) * volume, 0.02)
  }

  function disposeChain() {
    if (!chain) {
      return
    }
    const t = Tone.now()
    chain.synth.releaseAll(t)
    chain.synth.disconnect()
    chain.filter.disconnect()
    chain.gain.disconnect()
    chain.meter.disconnect()
    chain.synth.dispose()
    chain.filter.dispose()
    chain.meter.dispose()
    chain.gain.gain.cancelScheduledValues(t)
    chain.gain.gain.setValueAtTime(0, t)
    chain.gain.dispose()
    chain = null
  }

  function disposeEffects() {
    effects?.dispose()
    effects = null
  }

  function rebuildChain() {
    disposeChain()
    disposeEffects()
    effects = createLoopEffectsBus(reverbAmount, delayAmount)
    chain = buildSynthChain(instrumentId, effects.input)
    sink = createSynthNoteSink(chain.synth)
    applyVolume()
  }

  return {
    get sink() {
      if (!chain) {
        throw new Error('Loop voice is not prepared')
      }
      return sink
    },
    silence() {
      disposeChain()
      disposeEffects()
    },
    prepare() {
      rebuildChain()
    },
    getLevel() {
      if (!chain) {
        return 0
      }
      return readMeterLevel(chain.meter)
    },
    setVolume(amount: number) {
      volume = Math.min(1, Math.max(0, amount))
      applyVolume()
    },
    getVolume() {
      return volume
    },
    setReverb(amount: number) {
      reverbAmount = Math.min(1, Math.max(0, amount))
      effects?.setReverb(reverbAmount)
    },
    setDelay(amount: number) {
      delayAmount = Math.min(1, Math.max(0, amount))
      effects?.setDelay(delayAmount)
    },
  }
}

export function createLoopVoice(
  reverb = LOOP_REVERB_DEFAULT,
  delay = LOOP_DELAY_DEFAULT,
): LoopVoice {
  return createLoopVoiceForInstrument('pad', reverb, delay)
}

export function createPluckLoopVoice(
  reverb = LOOP_REVERB_DEFAULT,
  delay = LOOP_DELAY_DEFAULT,
): LoopVoice {
  return createLoopVoiceForInstrument('pluck', reverb, delay)
}
