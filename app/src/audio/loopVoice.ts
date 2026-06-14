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

/**
 * Per-reel voice overrides. Each is optional: when absent the instrument's
 * recipe default applies. Stored on the pattern and cleared on instrument
 * change, since each instrument has its own natural brightness and envelope.
 */
export type VoiceOverrides = {
  /** Low-pass cutoff in Hz. Default: recipe filterFrequency. */
  cutoff?: number
  /** Low-pass resonance (Q). Default: Tone.Filter default (1). */
  resonance?: number
  /** Chorus wet, 0–1. Default: 0 (dry). */
  chorus?: number
  /** Envelope attack in seconds. Overrides recipe envelope.attack. */
  attack?: number
  /** Envelope release in seconds. Overrides recipe envelope.release. */
  release?: number
}

type SynthChain = {
  synth: InstrumentPolySynth
  filter: Tone.Filter
  chorus: Tone.Chorus
  gain: Tone.Gain
  meter: Tone.Meter
}

/**
 * Apply an attack/release override onto the running synth. The recipe's decay
 * and sustain are preserved; only the two exposed stages change. The envelope
 * lives in different places per synth kind, so dispatch on the recipe.
 */
export function applyEnvelopeOverride(
  synth: InstrumentPolySynth,
  instrument: InstrumentId,
  attack: number | undefined,
  release: number | undefined,
): void {
  if (attack === undefined && release === undefined) {
    return
  }
  const recipe = INSTRUMENT_RECIPES[instrument]
  const envelope: { attack?: number; release?: number } = {}
  if (attack !== undefined) {
    envelope.attack = attack
  }
  if (release !== undefined) {
    envelope.release = release
  }
  if (recipe.kind === 'duo') {
    // DuoSynth nests its envelope under each voice; PolySynth<any>.set narrows
    // to a union that omits voice0/voice1, so cast to the DuoSynth shape.
    ;(synth as Tone.PolySynth<Tone.DuoSynth>).set({
      voice0: { envelope },
      voice1: { envelope },
    })
    return
  }
  synth.set({ envelope })
}

function buildSynthChain(
  instrument: InstrumentId,
  destination: Tone.InputNode,
  overrides: VoiceOverrides = {},
): SynthChain {
  const recipe = INSTRUMENT_RECIPES[instrument]
  const synth = createInstrumentPolySynth(instrument)
  applyEnvelopeOverride(synth, instrument, overrides.attack, overrides.release)

  const filter = new Tone.Filter({
    frequency: overrides.cutoff ?? recipe.filterFrequency,
    Q: overrides.resonance ?? 1,
    type: 'lowpass',
    rolloff: -12,
  })
  const chorus = new Tone.Chorus({
    frequency: 1.5,
    delayTime: 3.5,
    depth: 0.7,
    wet: overrides.chorus ?? 0,
  }).start()
  const gain = new Tone.Gain(instrumentOutputGain(instrument))
  const meter = new Tone.Meter({ normalRange: true, smoothing: 0.45 })

  synth.connect(filter)
  filter.connect(chorus)
  chorus.connect(gain)
  gain.connect(meter)
  meter.connect(destination)

  return { synth, filter, chorus, gain, meter }
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
  setCutoff: (hz: number | undefined) => void
  setResonance: (q: number | undefined) => void
  setChorus: (amount: number | undefined) => void
  setEnvelope: (attack: number | undefined, release: number | undefined) => void
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
  overrides: VoiceOverrides = {},
): LoopVoice {
  const instrumentId = normalizeInstrument(instrument)
  let effects: LoopEffectsBus | null = createLoopEffectsBus(reverb, delay)
  let chain: SynthChain | null = buildSynthChain(instrumentId, effects.input, overrides)
  let sink = createSynthNoteSink(chain.synth)
  let volume = 1
  let reverbAmount = reverb
  let delayAmount = delay
  // Track overrides so a chain rebuild (prepare/silence cycle) restores them.
  const voice: VoiceOverrides = { ...overrides }

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
    chain.chorus.disconnect()
    chain.gain.disconnect()
    chain.meter.disconnect()
    chain.synth.dispose()
    chain.filter.dispose()
    chain.chorus.dispose()
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
    chain = buildSynthChain(instrumentId, effects.input, voice)
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
    setCutoff(hz: number | undefined) {
      voice.cutoff = hz
      if (chain) {
        chain.filter.frequency.rampTo(
          hz ?? INSTRUMENT_RECIPES[instrumentId].filterFrequency,
          0.05,
        )
      }
    },
    setResonance(q: number | undefined) {
      voice.resonance = q
      if (chain) {
        chain.filter.Q.rampTo(q ?? 1, 0.05)
      }
    },
    setChorus(amount: number | undefined) {
      const clamped = Math.min(1, Math.max(0, amount ?? 0))
      voice.chorus = amount
      if (chain) {
        chain.chorus.wet.rampTo(clamped, 0.05)
      }
    },
    setEnvelope(attack: number | undefined, release: number | undefined) {
      voice.attack = attack
      voice.release = release
      if (chain) {
        applyEnvelopeOverride(chain.synth, instrumentId, attack, release)
      }
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
