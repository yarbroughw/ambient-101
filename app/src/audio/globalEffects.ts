import * as Tone from 'tone'

const REVERB_DEFAULT = 0.75
const DELAY_DEFAULT = 0.3
const VOLUME_DEFAULT = 1

let initialized = false
let input: Tone.Gain | null = null
let dry: Tone.Gain | null = null
let reverb: Tone.Reverb | null = null
let reverbSend: Tone.Gain | null = null
let delay: Tone.PingPongDelay | null = null
let delaySend: Tone.Gain | null = null
let master: Tone.Gain | null = null
let analyser: Tone.Analyser | null = null

let reverbAmount = REVERB_DEFAULT
let delayAmount = DELAY_DEFAULT
let volumeAmount = VOLUME_DEFAULT

function refreshMix(): void {
  if (!dry || !reverbSend || !delaySend) {
    return
  }

  const t = Tone.now()
  const dryLevel = (1 - reverbAmount) * (1 - delayAmount)
  dry.gain.cancelAndHoldAtTime(t)
  dry.gain.rampTo(dryLevel, 0.05)
  reverbSend.gain.cancelAndHoldAtTime(t)
  reverbSend.gain.rampTo(reverbAmount, 0.05)
  delaySend.gain.cancelAndHoldAtTime(t)
  delaySend.gain.rampTo(delayAmount, 0.05)
}

function refreshVolume(): void {
  if (!master) {
    return
  }
  const t = Tone.now()
  master.gain.cancelAndHoldAtTime(t)
  master.gain.rampTo(volumeAmount, 0.05)
}

function ensureGlobalEffects(): void {
  if (initialized) {
    return
  }

  input = new Tone.Gain(1)
  master = new Tone.Gain(volumeAmount)
  analyser = new Tone.Analyser('fft', 4096)
  master.connect(analyser)
  master.toDestination()
  dry = new Tone.Gain(1)

  reverb = new Tone.Reverb({
    decay: 6,
    preDelay: 0.03,
    wet: 1,
  })
  reverbSend = new Tone.Gain(reverbAmount)

  delay = new Tone.PingPongDelay({
    delayTime: 0.45,
    feedback: 0.45,
    wet: 1,
  })
  delaySend = new Tone.Gain(delayAmount)

  input.connect(dry)
  input.connect(reverb)
  reverb.connect(reverbSend)
  input.connect(delay)
  delay.connect(delaySend)

  dry.connect(master)
  reverbSend.connect(master)
  delaySend.connect(master)

  void reverb.generate()
  refreshMix()
  refreshVolume()

  initialized = true
}

export function getGlobalEffectInput(): Tone.Gain {
  ensureGlobalEffects()
  return input!
}

export function getMasterAnalyser(): Tone.Analyser {
  ensureGlobalEffects()
  return analyser!
}

export function getGlobalReverb(): number {
  return reverbAmount
}

export function getGlobalDelay(): number {
  return delayAmount
}

export function getGlobalVolume(): number {
  return volumeAmount
}

export function setGlobalReverb(amount: number): void {
  reverbAmount = Math.min(1, Math.max(0, amount))
  ensureGlobalEffects()
  refreshMix()
}

export function setGlobalDelay(amount: number): void {
  delayAmount = Math.min(1, Math.max(0, amount))
  ensureGlobalEffects()
  refreshMix()
}

export function setGlobalVolume(amount: number): void {
  volumeAmount = Math.min(1, Math.max(0, amount))
  ensureGlobalEffects()
  refreshVolume()
}
