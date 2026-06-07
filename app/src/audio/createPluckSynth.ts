import * as Tone from 'tone'
import {
  createLoopEffectsBus,
  LOOP_DELAY_DEFAULT,
  LOOP_REVERB_DEFAULT,
  type LoopEffectsBus,
} from './loopEffects'
import { createSynthNoteSink, type LoopVoice } from './createPadSynth'

const OUTPUT_GAIN = 0.38

type SynthChain = {
  synth: Tone.PolySynth
  filter: Tone.Filter
  gain: Tone.Gain
  meter: Tone.Meter
}

function buildSynthChain(destination: Tone.InputNode): SynthChain {
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
  meter.connect(destination)

  return { synth, filter, gain, meter }
}

function readMeterLevel(meter: Tone.Meter): number {
  const value = meter.getValue()
  return typeof value === 'number' ? value : 0
}

export function createPluckLoopVoice(
  reverb = LOOP_REVERB_DEFAULT,
  delay = LOOP_DELAY_DEFAULT,
): LoopVoice {
  let effects: LoopEffectsBus | null = createLoopEffectsBus(reverb, delay)
  let chain: SynthChain | null = buildSynthChain(effects.input)
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
    chain.gain.gain.rampTo(OUTPUT_GAIN * volume, 0.02)
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
    chain = buildSynthChain(effects.input)
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
