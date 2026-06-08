import * as Tone from 'tone'

const MAX_POLYPHONY = 8

type PluckVoiceOptions = {
  attackNoise: number
  dampening: number
  resonance: number
  hold: number
  release: number
  volume: number
}

type ActiveVoice = {
  voice: Tone.PluckSynth
  freeAt: number
}

export class PluckPolySynth {
  private readonly voices: Tone.PluckSynth[] = []
  private readonly active: ActiveVoice[] = []
  private readonly output = new Tone.Gain(1)
  private options: PluckVoiceOptions

  constructor(options: PluckVoiceOptions) {
    this.options = options
  }

  set(options: Partial<PluckVoiceOptions>): this {
    this.options = { ...this.options, ...options }
    for (const voice of this.voices) {
      voice.set(options)
    }
    return this
  }

  connect(destination: Tone.InputNode): this {
    this.output.connect(destination)
    return this
  }

  disconnect(): this {
    this.output.disconnect()
    return this
  }

  triggerAttackRelease(
    note: string,
    _duration: number,
    time: number,
    velocity = 1,
  ): this {
    const voice = this.acquireVoice(time)
    const holdSec = this.options.hold
    const releaseSec = Tone.Time(voice.release).toSeconds()
    const releaseAt = time + holdSec
    const freeAt = releaseAt + releaseSec

    voice.volume.value = this.options.volume + Tone.gainToDb(Math.min(1, Math.max(0, velocity)))
    voice.triggerAttack(note, time)
    voice.triggerRelease(releaseAt)

    this.active.push({ voice, freeAt })
    return this
  }

  releaseAll(time: number): this {
    for (const voice of this.voices) {
      voice.triggerRelease(time)
    }
    this.active.length = 0
    return this
  }

  dispose(): void {
    for (const voice of this.voices) {
      voice.dispose()
    }
    this.voices.length = 0
    this.active.length = 0
    this.output.dispose()
  }

  private acquireVoice(time: number): Tone.PluckSynth {
    this.recycleVoices(time)

    const idle = this.voices.find(
      (voice) => !this.active.some((entry) => entry.voice === voice),
    )
    if (idle) {
      return idle
    }

    if (this.voices.length < MAX_POLYPHONY) {
      const voice = new Tone.PluckSynth(this.options)
      voice.connect(this.output)
      this.voices.push(voice)
      return voice
    }

    const oldest = this.active.shift()
    if (oldest) {
      oldest.voice.triggerRelease(time)
      return oldest.voice
    }

    const voice = new Tone.PluckSynth(this.options)
    voice.connect(this.output)
    this.voices.push(voice)
    return voice
  }

  private recycleVoices(time: number): void {
    for (let index = this.active.length - 1; index >= 0; index -= 1) {
      if (this.active[index].freeAt <= time) {
        this.active.splice(index, 1)
      }
    }
  }
}
