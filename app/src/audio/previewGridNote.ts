import * as Tone from 'tone'
import { getGlobalEffectInput } from './globalEffects'

type PreviewVoice = {
  synth: Tone.PolySynth
}

const voices: Partial<Record<'pad' | 'pluck', PreviewVoice>> = {}

function ensurePreviewVoice(instrument: 'pad' | 'pluck'): PreviewVoice {
  const existing = voices[instrument]
  if (existing) {
    return existing
  }

  const synth = new Tone.PolySynth(Tone.Synth)
  if (instrument === 'pluck') {
    synth.set({
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.8, sustain: 0.25, release: 1.5 },
      volume: -10,
    })
  } else {
    synth.set({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.08, decay: 0.4, sustain: 0.5, release: 0.6 },
      volume: -8,
    })
  }

  const filter = new Tone.Filter({
    frequency: instrument === 'pluck' ? 1200 : 2000,
    type: 'lowpass',
    rolloff: -12,
  })
  const gain = new Tone.Gain(instrument === 'pluck' ? 0.38 : 0.42)

  synth.connect(filter)
  filter.connect(gain)
  gain.connect(getGlobalEffectInput())

  const voice = { synth }
  voices[instrument] = voice
  return voice
}

export function previewGridNote(
  pitch: string,
  durationSec: number,
  instrument: string,
  velocity = 0.7,
): void {
  if (Tone.getContext().state !== 'running') {
    return
  }

  const voiceKey = instrument === 'pluck' ? 'pluck' : 'pad'
  const { synth } = ensurePreviewVoice(voiceKey)
  synth.triggerAttackRelease(pitch, durationSec, Tone.now(), velocity)
}
