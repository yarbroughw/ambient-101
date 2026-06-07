import * as Tone from 'tone'
import { getMasterInput } from './globalEffects'

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
  const reverb = new Tone.Reverb({
    decay: 6,
    preDelay: 0.03,
    wet: 1,
  })
  const reverbSend = new Tone.Gain(reverbLevel)
  const delay = new Tone.PingPongDelay({
    delayTime: 0.45,
    feedback: 0.45,
    wet: 1,
  })
  const delaySend = new Tone.Gain(delayLevel)
  const masterInput = getMasterInput()

  input.connect(dry)
  input.connect(reverb)
  reverb.connect(reverbSend)
  input.connect(delay)
  delay.connect(delaySend)

  dry.connect(masterInput)
  reverbSend.connect(masterInput)
  delaySend.connect(masterInput)

  void reverb.generate()

  function refreshMix(): void {
    const t = Tone.now()
    const dryLevel = (1 - reverbLevel) * (1 - delayLevel)
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
      input.disconnect()
      dry.disconnect()
      reverb.disconnect()
      reverbSend.disconnect()
      delay.disconnect()
      delaySend.disconnect()
      input.dispose()
      dry.dispose()
      reverb.dispose()
      reverbSend.dispose()
      delay.dispose()
      delaySend.dispose()
    },
  }
}
