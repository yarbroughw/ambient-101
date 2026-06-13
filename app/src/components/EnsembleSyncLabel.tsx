import { useMemo, useState } from 'react'
import type { DemoLoop } from '../audio/demoPatterns'
import { heardNowSec } from '../audio/outputLatency'
import { applyPlaybackTiming, type PaceOptions } from '../lib/globalPace'
import {
  ensembleCycleMs,
  formatSyncDuration,
  timeUntilEnsembleSyncMs,
  type ReelPeriodsMs,
} from '../lib/ensembleSync'
import { useAnimationFrame } from '../hooks/useAnimationFrame'
import './EnsembleSyncLabel.css'

type EnsembleSyncLabelProps = {
  loops: DemoLoop[]
  pace: PaceOptions
  runningById: Record<string, boolean>
}

function reelPeriodsMs(
  loop: DemoLoop,
  pace: PaceOptions,
): ReelPeriodsMs {
  const timing = applyPlaybackTiming(loop.pattern, pace)
  return {
    composedMs: loop.pattern.loopDurationMs,
    playbackMs: Math.round(timing.loopDurationSec * 1000),
  }
}

export function EnsembleSyncLabel({
  loops,
  pace,
  runningById,
}: EnsembleSyncLabelProps) {
  const runningCount = loops.filter(
    ({ pattern }) => runningById[pattern.id],
  ).length
  useAnimationFrame(runningCount >= 2)
  const [showElapsed, setShowElapsed] = useState(false)

  const periodsMs = useMemo(
    () => loops.map((loop) => reelPeriodsMs(loop, pace)),
    [loops, pace],
  )

  if (loops.length < 2) {
    return <p className="ensemble-sync-label" aria-hidden="true" />
  }

  const cycleSec = ensembleCycleMs(periodsMs) / 1000
  const runningLoops = loops.filter(({ pattern }) => runningById[pattern.id])

  if (runningLoops.length < 2) {
    return (
      <p className="ensemble-sync-label">{'resync in '}{formatSyncDuration(cycleSec)}</p>
    )
  }

  const startsMs = runningLoops.map(({ loop }) =>
    Math.round((loop.getStartTimeSec() ?? 0) * 1000),
  )
  const runningPeriodsMs = runningLoops.map((loop) =>
    reelPeriodsMs(loop, pace),
  )
  const totalSec = ensembleCycleMs(runningPeriodsMs) / 1000
  const nowMs = heardNowSec() * 1000
  const remainingSec =
    timeUntilEnsembleSyncMs(runningPeriodsMs, startsMs, nowMs) / 1000
  const elapsedSec = totalSec - remainingSec
  const percent =
    totalSec > 0 ? Math.min(100, Math.round((elapsedSec / totalSec) * 100)) : 0

  return (
    <p className="ensemble-sync-label">
      {'resync in '}
      <button
        type="button"
        className="ensemble-sync-label__toggle"
        title={showElapsed ? 'elapsed (click for remaining)' : 'remaining (click for elapsed)'}
        onClick={() => setShowElapsed((value) => !value)}
      >
        {showElapsed
          ? formatSyncDuration(elapsedSec)
          : `-${formatSyncDuration(remainingSec)}`}
      </button>
      {' / '}
      {formatSyncDuration(totalSec)}
      {' · '}
      {percent}%
    </p>
  )
}
