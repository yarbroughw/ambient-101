import * as Tone from 'tone'
import type { NoteSink } from './types'

/** Routes each note through Transport so it can be cleared when the loop stops. */
export function createSchedulableNoteSink(
  inner: NoteSink,
  onScheduled: (transportId: number) => void,
): NoteSink {
  return {
    triggerAttackRelease(note, duration, time, velocity = 1) {
      const id = Tone.getTransport().schedule((t) => {
        inner.triggerAttackRelease(note, duration, t, velocity)
      }, time)
      onScheduled(id)
    },
  }
}
