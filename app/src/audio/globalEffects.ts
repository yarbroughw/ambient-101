import * as Tone from 'tone'

const VOLUME_DEFAULT = 1

const LIMITER_THRESHOLD_DB = -6

let initialized = false
let input: Tone.Gain | null = null
let master: Tone.Gain | null = null
let limiter: Tone.Limiter | null = null
let analyser: Tone.Analyser | null = null
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
  limiter = new Tone.Limiter(LIMITER_THRESHOLD_DB)
  analyser = new Tone.Analyser('fft', 4096)

  input.connect(master)
  master.connect(limiter)
  limiter.connect(analyser)
  analyser.toDestination()

  refreshVolume()
  initialized = true
}

export function getMasterInput(): Tone.Gain {
  ensureGlobalEffects()
  return input!
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
