import * as Tone from 'tone'
import { audioToTransportSec } from './audioSession'
import type { NoteSink } from './types'

// Notes at the loop downbeat (col 0) arrive inside a Transport callback at
// `time ≈ Tone.now()`. Re-scheduling them on the Transport lands on the
// current tick after forEachAtTime has already run, so the event is dropped.
// 20ms is well below the shortest grid step (62.5ms at 240 BPM).
const IMMEDIATE_NOTE_THRESHOLD_SEC = 0.02

/** Routes each note through Transport so it can be cleared when the loop stops. */
export function createSchedulableNoteSink(
  inner: NoteSink,
  onScheduled: (transportId: number) => void,
): NoteSink {
  return {
    triggerAttackRelease(note, duration, time, velocity = 1) {
      const now = Tone.now()
      const isImmediate = time <= now + IMMEDIATE_NOTE_THRESHOLD_SEC

      if (isImmediate) {
        inner.triggerAttackRelease(note, duration, time, velocity)
        return
      }

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
