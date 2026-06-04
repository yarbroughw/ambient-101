export type ScheduleTime = number

export type TapeLoopCallback = (time: ScheduleTime) => void

export interface NoteSink {
  triggerAttackRelease(
    note: string,
    duration: number,
    time: ScheduleTime,
    velocity?: number,
  ): void
}
