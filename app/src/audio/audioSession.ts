import * as Tone from 'tone'

let sessionStarted = false

export function isAudioSessionStarted(): boolean {
  return sessionStarted
}

export async function ensureAudioStarted(): Promise<void> {
  await Tone.start()

  const context = Tone.getContext()
  if (context.state === 'suspended') {
    await context.resume()
  }

  const transport = Tone.getTransport()
  if (transport.state !== 'started') {
    transport.start()
  }

  sessionStarted = true
}
