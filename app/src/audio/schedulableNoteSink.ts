import * as Tone from 'tone'
import { audioToTransportSec } from './audioSession'
import type { NoteSink } from './types'

/** Routes each note through Transport so it can be cleared when the loop stops. */
export function createSchedulableNoteSink(
  inner: NoteSink,
  onScheduled: (transportId: number) => void,
): NoteSink {
  return {
    triggerAttackRelease(note, duration, time, velocity = 1) {
      // `time` is an audio-clock timestamp (from the loop tick), but
      // Transport.schedule expects transport-timeline seconds — scheduling
      // it raw delays every note by the transport's lag behind the audio
      // clock.
      const id = Tone.getTransport().schedule((t) => {
        inner.triggerAttackRelease(note, duration, t, velocity)
      }, audioToTransportSec(time))
      onScheduled(id)
    },
  }
}
