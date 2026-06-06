import * as Tone from 'tone'
import { getGlobalEffectInput } from './globalEffects'
import type { NoteSink } from './types'

const OUTPUT_GAIN = 0.42

type SynthChain = {
  synth: Tone.PolySynth
  filter: Tone.Filter
  gain: Tone.Gain
  meter: Tone.Meter
}

function buildSynthChain(): SynthChain {
  const synth = new Tone.PolySynth(Tone.Synth)
  synth.set({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 1, decay: 1, sustain: 0.7, release: 4 },
    volume: -8,
  })

  const filter = new Tone.Filter({
    frequency: 2000,
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

export type LoopVoice = {
  sink: NoteSink
  silence: () => void
  prepare: () => void
  getLevel: () => number
  setVolume: (amount: number) => void
  getVolume: () => number
}

function readMeterLevel(meter: Tone.Meter): number {
  const value = meter.getValue()
  return typeof value === 'number' ? value : 0
}

export function createLoopVoice(): LoopVoice {
  let chain: SynthChain | null = buildSynthChain()
  let sink = createSynthNoteSink(chain.synth)
  let volume = 1

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
      applyVolume()
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
  }
}

export function createSynthNoteSink(synth: Tone.PolySynth): NoteSink {
  return {
    triggerAttackRelease(note, duration, time, velocity = 1) {
      synth.triggerAttackRelease(note, duration, time, velocity)
    },
  }
}
