import * as Tone from 'tone'
import { getMasterInput } from './globalEffects'
import {
  createInstrumentPolySynth,
  instrumentFilterFrequency,
  instrumentPreviewGain,
  type InstrumentPolySynth,
} from './instruments/createInstrumentPolySynth'
import { normalizeInstrument, type InstrumentId } from './instruments/types'

type PreviewVoice = {
  synth: InstrumentPolySynth
}

const voices: Partial<Record<InstrumentId, PreviewVoice>> = {}

function ensurePreviewVoice(instrument: InstrumentId): PreviewVoice {
  const existing = voices[instrument]
  if (existing) {
    return existing
  }

  const synth = createInstrumentPolySynth(instrument)

  const filter = new Tone.Filter({
    frequency: instrumentFilterFrequency(instrument),
    type: 'lowpass',
    rolloff: -12,
  })
  const gain = new Tone.Gain(instrumentPreviewGain(instrument))

  synth.connect(filter)
  filter.connect(gain)
  gain.connect(getMasterInput())

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

  const instrumentId = normalizeInstrument(instrument)
  const { synth } = ensurePreviewVoice(instrumentId)
  synth.triggerAttackRelease(pitch, durationSec, Tone.now(), velocity)
}
