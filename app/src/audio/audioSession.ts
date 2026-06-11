import * as Tone from 'tone'

let sessionStarted = false

export function isAudioSessionStarted(): boolean {
  return sessionStarted
}

/** Current audio-clock time, for scheduling several loops at one shared instant. */
export function audioNowSec(): number {
  return Tone.now()
}

/** Current position on the transport timeline. */
export function transportNowSec(): number {
  return Tone.getTransport().seconds
}

/**
 * Converts an audio-clock timestamp to the transport timeline. The transport
 * starts later than the audio clock, so the two differ by a constant offset
 * while the transport runs; scheduling an audio timestamp directly on the
 * transport (Tone.Loop.start, Transport.schedule) lands that offset late.
 * Sampling both clocks in one call keeps the conversion exact.
 */
export function audioToTransportSec(audioTimeSec: number): number {
  return Tone.getTransport().seconds + (audioTimeSec - Tone.now())
}

function rawContext(): AudioContext {
  return Tone.getContext().rawContext as AudioContext
}

export async function ensureAudioStarted(): Promise<void> {
  await Tone.start()

  // Tone.start() only covers the initial user-gesture unlock. A context the
  // browser suspended after the tab idled — or Safari's non-standard
  // "interrupted" state — still needs an explicit resume(), so check for
  // anything other than "running" rather than just "suspended".
  if (rawContext().state !== 'running') {
    await rawContext().resume()
  }

  const transport = Tone.getTransport()
  if (transport.state !== 'started') {
    transport.start()
  }

  sessionStarted = true
}

export type AudioSessionRecovery = {
  dispose(): void
}

const STALL_CHECK_INTERVAL_MS = 1000

/**
 * Watches the audio context and tries to recover it when the browser
 * suspends it behind the app's back (long idle, device sleep, output-device
 * changes). `onRunningChange` reports whether the context is actually
 * running so the UI can stop pretending audio is playing when it is not —
 * a resume() outside a user gesture is not always permitted.
 */
export function installAudioSessionRecovery(
  onRunningChange: (running: boolean) => void,
): AudioSessionRecovery {
  const raw = rawContext()

  async function tryResume(): Promise<void> {
    if (!sessionStarted || raw.state === 'running') {
      return
    }
    try {
      await raw.resume()
    } catch {
      // Resume can be rejected without a user gesture; the play/resume
      // affordances call ensureAudioStarted() and recover from there.
    }
  }

  function handleStateChange(): void {
    onRunningChange(raw.state === 'running')
    void tryResume()
  }

  function handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      void tryResume()
    }
  }

  // Watchdog for a context that still reports "running" but whose clock is
  // frozen (seen on macOS Chrome after device sleep or output-device
  // switches). A suspend/resume cycle unwedges it.
  let lastClock = -1
  let unwedging = false
  const watchdogId = window.setInterval(() => {
    if (!sessionStarted || unwedging || raw.state !== 'running') {
      lastClock = -1
      return
    }
    const clock = raw.currentTime
    if (clock === lastClock) {
      unwedging = true
      onRunningChange(false)
      void raw
        .suspend()
        .then(() => raw.resume())
        .then(() => onRunningChange(raw.state === 'running'))
        .catch(() => undefined)
        .finally(() => {
          unwedging = false
        })
    }
    lastClock = clock
  }, STALL_CHECK_INTERVAL_MS)

  raw.addEventListener('statechange', handleStateChange)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  return {
    dispose() {
      window.clearInterval(watchdogId)
      raw.removeEventListener('statechange', handleStateChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    },
  }
}
