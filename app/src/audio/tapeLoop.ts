import * as Tone from 'tone'
import type { TapeLoopCallback } from './types'

export class TapeLoop {
  readonly label: string

  private durationSeconds: number
  private recording: TapeLoopCallback | null = null
  private toneLoop: Tone.Loop | null = null
  private running = false
  private startedAtMs = 0
  private silenceAudio: (() => void) | null = null
  private prepareAudio: (() => void) | null = null
  private getLevelAudio: (() => number) | null = null
  private scheduledNoteIds: number[] = []

  constructor(label: string, durationSeconds = 8) {
    this.label = label
    this.durationSeconds = durationSeconds
  }

  get duration(): number {
    return this.durationSeconds
  }

  get isRunning(): boolean {
    return this.running
  }

  addScheduledNote(transportId: number): void {
    this.scheduledNoteIds.push(transportId)
  }

  record(content: TapeLoopCallback): this {
    this.recording = content
    this.rebuildLoop()
    return this
  }

  bindAudioHooks(hooks: {
    silence: () => void
    prepare?: () => void
    getLevel?: () => number
  }): this {
    this.silenceAudio = hooks.silence
    this.prepareAudio = hooks.prepare ?? null
    this.getLevelAudio = hooks.getLevel ?? null
    return this
  }

  getLevel(): number {
    return this.getLevelAudio?.() ?? 0
  }

  setDuration(durationSeconds: number): void {
    this.durationSeconds = durationSeconds
    if (this.recording) {
      this.rebuildLoop()
    }
  }

  start(): void {
    if (this.running || !this.recording) {
      return
    }

    this.prepareAudio?.()
    this.clearScheduledNotes()
    this.disposeToneLoop()

    this.toneLoop = new Tone.Loop(this.recording, this.durationSeconds)
    this.toneLoop.start(Tone.now())
    this.running = true
    this.startedAtMs = performance.now()
  }

  stop(): void {
    this.clearScheduledNotes()

    if (this.toneLoop) {
      this.toneLoop.stop(Tone.now())
      this.toneLoop.cancel(Tone.now())
    }

    this.running = false
    this.silenceAudio?.()
    this.disposeToneLoop()
  }

  test(): void {
    if (!this.recording) {
      return
    }

    this.clearScheduledNotes()
    if (!this.running) {
      this.prepareAudio?.()
    }

    this.recording(Tone.now())
  }

  getProgress(): number {
    if (!this.running) {
      return 0
    }
    const elapsed = (performance.now() - this.startedAtMs) / 1000
    return (elapsed % this.durationSeconds) / this.durationSeconds
  }

  dispose(): void {
    this.clearScheduledNotes()
    if (this.toneLoop) {
      this.toneLoop.stop(Tone.now())
      this.toneLoop.cancel(Tone.now())
    }
    this.running = false
    this.disposeToneLoop()
    this.silenceAudio?.()
    this.silenceAudio = null
    this.prepareAudio = null
    this.getLevelAudio = null
  }

  private clearScheduledNotes(): void {
    const transport = Tone.getTransport()
    for (const id of this.scheduledNoteIds) {
      transport.clear(id)
    }
    this.scheduledNoteIds = []
  }

  private disposeToneLoop(): void {
    this.toneLoop?.dispose()
    this.toneLoop = null
  }

  private rebuildLoop(): void {
    if (!this.recording) {
      return
    }

    const wasRunning = this.running
    if (wasRunning) {
      this.stop()
    } else {
      this.disposeToneLoop()
      this.toneLoop = new Tone.Loop(this.recording, this.durationSeconds)
    }
  }
}
