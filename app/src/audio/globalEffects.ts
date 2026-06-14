import * as Tone from 'tone'

const VOLUME_DEFAULT = 1

const LIMITER_THRESHOLD_DB = -6
const MASTER_MAKEUP_GAIN_DB = 6

// Shared reverb. Every reel sends into this single convolution rather than
// owning its own, so the ensemble shares one space (and one expensive impulse).
const REVERB_DECAY = 6
const REVERB_PREDELAY = 0.03

let initialized = false
let input: Tone.Gain | null = null
let master: Tone.Gain | null = null
let makeup: Tone.Gain | null = null
let limiter: Tone.Limiter | null = null
let analyser: Tone.Analyser | null = null
let reverb: Tone.Reverb | null = null
let volumeAmount = VOLUME_DEFAULT

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
  makeup = new Tone.Gain(Tone.dbToGain(MASTER_MAKEUP_GAIN_DB))
  limiter = new Tone.Limiter(LIMITER_THRESHOLD_DB)
  analyser = new Tone.Analyser('fft', 4096)
  reverb = new Tone.Reverb({
    decay: REVERB_DECAY,
    preDelay: REVERB_PREDELAY,
    wet: 1,
  })

  input.connect(master)
  master.connect(makeup)
  makeup.connect(limiter)
  limiter.connect(analyser)
  analyser.toDestination()

  // Reverb returns into the master input so its tail is summed and limited
  // alongside the dry signal. Reels feed it via getReverbSend().
  reverb.connect(input)
  void reverb.generate()

  refreshVolume()
  initialized = true
}

export function getMasterInput(): Tone.Gain {
  ensureGlobalEffects()
  return input!
}

/** Shared reverb input. Reels send their wet signal here (see loopEffects). */
export function getReverbSend(): Tone.InputNode {
  ensureGlobalEffects()
  return reverb!
}

/** @deprecated Use getMasterInput */
export function getGlobalEffectInput(): Tone.Gain {
  return getMasterInput()
}

export function getMasterAnalyser(): Tone.Analyser {
  ensureGlobalEffects()
  return analyser!
}

export function getGlobalVolume(): number {
  return volumeAmount
}

export function setGlobalVolume(amount: number): void {
  volumeAmount = Math.min(1, Math.max(0, amount))
  ensureGlobalEffects()
  refreshVolume()
}
