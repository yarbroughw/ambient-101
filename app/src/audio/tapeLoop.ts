import * as Tone from 'tone'
import { audioToTransportSec, transportNowSec } from './audioSession'
import {
  heardLoopProgress,
  heardLoopTimeSec,
  heardTimeSec,
} from './outputLatency'
import type { TapeLoopCallback } from './types'

export class TapeLoop {
  readonly label: string

  private durationSeconds: number
  private recording: TapeLoopCallback | null = null
  private toneLoop: Tone.Loop | null = null
  private running = false
  private testing = false
  private startAudioTime = 0
  private testStartAudioTime = 0
  private testDurationSec = 0
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

  isTesting(): boolean {
    return this.testing
  }

  getTestTimeSec(): number {
    if (!this.testing) {
      return 0
    }

    const elapsed = Tone.now() - this.testStartAudioTime
    if (elapsed >= this.testDurationSec) {
      this.testing = false
      return this.testDurationSec
    }

    return heardTimeSec(elapsed)
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

  /**
   * Starts playback. Pass a shared atTimeSec when starting several loops
   * together — anchoring each loop at its own Tone.now() staggers them by
   * the (variable) per-loop setup cost, which genuinely shifts where their
   * downbeats align.
   */
  start(atTimeSec?: number): void {
    if (this.running || !this.recording) {
      return
    }

    this.testing = false
    this.prepareAudio?.()
    this.clearScheduledNotes()
    this.disposeToneLoop()

    const startAt = atTimeSec ?? Tone.now()
    this.toneLoop = new Tone.Loop(this.recording, this.durationSeconds)
    // Tone.Loop runs on the transport timeline; startAt is an audio-clock
    // time, so convert — passing it raw starts the loop late by the
    // transport's lag behind the audio clock.
    this.toneLoop.start(audioToTransportSec(startAt))
    this.startAudioTime = startAt
    this.running = true
  }

  stop(): void {
    this.clearScheduledNotes()

    if (this.toneLoop) {
      this.toneLoop.stop(transportNowSec())
      this.toneLoop.cancel(transportNowSec())
    }

    this.running = false
    this.testing = false
    this.silenceAudio?.()
    this.disposeToneLoop()
  }

  test(playbackDurationSec: number): void {
    if (!this.recording) {
      return
    }

    this.clearScheduledNotes()
    if (!this.running) {
      this.prepareAudio?.()
    }

    this.testing = true
    this.testStartAudioTime = Tone.now()
    this.testDurationSec = playbackDurationSec
    this.recording(Tone.now())
  }

  /**
   * Audio-clock time this loop's current lap grid is anchored to (its
   * scheduled start, kept consistent across mid-playback rebuilds), or null
   * when stopped.
   */
  getStartTimeSec(): number | null {
    return this.running ? this.startAudioTime : null
  }

  getProgress(): number {
    if (!this.running || !this.toneLoop) {
      return 0
    }
    return heardLoopProgress(
      this.toneLoop.progress,
      this.durationSeconds,
      Tone.now() - this.startAudioTime,
    )
  }

  getLoopTimeSec(): number {
    if (this.running) {
      return heardLoopTimeSec(
        this.toneLoop!.progress * this.durationSeconds,
        this.durationSeconds,
        Tone.now() - this.startAudioTime,
      )
    }
    if (this.testing) {
      return this.getTestTimeSec()
    }
    return 0
  }

  dispose(): void {
    this.clearScheduledNotes()
    if (this.toneLoop) {
      this.toneLoop.stop(transportNowSec())
      this.toneLoop.cancel(transportNowSec())
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
    const savedProgress =
      wasRunning && this.toneLoop ? this.toneLoop.progress : 0

    this.clearScheduledNotes()

    if (this.toneLoop) {
      this.toneLoop.stop(transportNowSec())
      this.toneLoop.cancel(transportNowSec())
    }
    this.disposeToneLoop()

    this.toneLoop = new Tone.Loop(this.recording, this.durationSeconds)

    if (wasRunning) {
      const offsetSec = savedProgress * this.durationSeconds
      const startAt = Tone.now() - offsetSec
      this.toneLoop.start(audioToTransportSec(startAt))
      this.startAudioTime = startAt
      this.running = true
      return
    }

    this.running = false
  }
}
