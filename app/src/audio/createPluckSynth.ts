import * as Tone from 'tone'
import { getGlobalEffectInput } from './globalEffects'
import { createSynthNoteSink } from './createPadSynth'
import type { LoopVoice } from './createPadSynth'

const OUTPUT_GAIN = 0.38

type SynthChain = {
  synth: Tone.PolySynth
  filter: Tone.Filter
  gain: Tone.Gain
  meter: Tone.Meter
}

function buildSynthChain(): SynthChain {
  const synth = new Tone.PolySynth(Tone.Synth)
  synth.set({
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.8, sustain: 0.25, release: 1.5 },
    volume: -10,
  })

  const filter = new Tone.Filter({
    frequency: 1200,
    type: 'lowpass',
    rolloff: -12,
  })
  const gain = new Tone.Gain(OUTPUT_GAIN)
  const meter = new Tone.Meter({ normalRange: true, smoothing: 0.45 })

  synth.connect(filter)
  filter.connect(gain)
  gain.connect(meter)
  meter.connect(getGlobalEffectInput())

  return { synth, filter, gain, meter }
}

function readMeterLevel(meter: Tone.Meter): number {
  const value = meter.getValue()
  return typeof value === 'number' ? value : 0
}

export function createPluckLoopVoice(): LoopVoice {
  let chain: SynthChain | null = buildSynthChain()
  let sink = createSynthNoteSink(chain.synth)

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

  return {
    get sink() {
      if (!chain) {
        throw new Error('Loop voice is not prepared')
      }
      return sink
    },
    silence() {
      disposeChain()
    },
    prepare() {
      disposeChain()
      chain = buildSynthChain()
      sink = createSynthNoteSink(chain.synth)
    },
    getLevel() {
      if (!chain) {
        return 0
      }
      return readMeterLevel(chain.meter)
    },
  }
}
