import * as Tone from 'tone'
import { getMasterInput, getReverbSend } from './globalEffects'

export const LOOP_REVERB_DEFAULT = 0.75
export const LOOP_DELAY_DEFAULT = 0.3

export type LoopEffectsBus = {
  input: Tone.Gain
  setReverb: (amount: number) => void
  setDelay: (amount: number) => void
  dispose: () => void
}

function clampAmount(amount: number): number {
  return Math.min(1, Math.max(0, amount))
}

export function createLoopEffectsBus(
  reverbAmount = LOOP_REVERB_DEFAULT,
  delayAmount = LOOP_DELAY_DEFAULT,
): LoopEffectsBus {
  let reverbLevel = clampAmount(reverbAmount)
  let delayLevel = clampAmount(delayAmount)

  const input = new Tone.Gain(1)
  const dry = new Tone.Gain(1)
  // Wet send into the shared reverb (see globalEffects). The crossfade is kept:
  // dry falls as the send rises, so reverb=1 is fully wet, matching the old bus.
  const reverbSend = new Tone.Gain(reverbLevel)
  const delay = new Tone.PingPongDelay({
    delayTime: 0.45,
    feedback: 0.45,
    wet: 1,
  })
  const delaySend = new Tone.Gain(delayLevel)
  const masterInput = getMasterInput()

  input.connect(dry)
  input.connect(reverbSend)
  reverbSend.connect(getReverbSend())
  input.connect(delay)
  delay.connect(delaySend)

  dry.connect(masterInput)
  delaySend.connect(masterInput)

  function refreshMix(): void {
    const t = Tone.now()
    const dryLevel = 1 - reverbLevel
    dry.gain.cancelAndHoldAtTime(t)
    dry.gain.rampTo(dryLevel, 0.05)
    reverbSend.gain.cancelAndHoldAtTime(t)
    reverbSend.gain.rampTo(reverbLevel, 0.05)
    delaySend.gain.cancelAndHoldAtTime(t)
    delaySend.gain.rampTo(delayLevel, 0.05)
  }

  refreshMix()

  return {
    input,
    setReverb(amount: number) {
      reverbLevel = clampAmount(amount)
      refreshMix()
    },
    setDelay(amount: number) {
      delayLevel = clampAmount(amount)
      refreshMix()
    },
    dispose() {
      // The shared reverb persists; only this reel's send chain is torn down.
      input.disconnect()
      dry.disconnect()
      reverbSend.disconnect()
      delay.disconnect()
      delaySend.disconnect()
      input.dispose()
      dry.dispose()
      reverbSend.dispose()
      delay.dispose()
      delaySend.dispose()
    },
  }
}
