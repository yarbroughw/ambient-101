import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { DemoLoop } from '../audio/demoPatterns'
import type { LoopPattern } from '../audio/patternTypes'
import type { TapeLoop } from '../audio/tapeLoop'
import { melodyWindowDuration } from '../lib/gridLayout'
import { formatDisplayLoopDuration } from '../lib/globalPace'
import type { TimelineMotion } from '../lib/motionSettings'
import {
  laneMelodyWidth,
  laneTileWidth,
  medianPeriod,
  visibleCycles,
} from '../lib/timelineLayout'
import { useLoopProgress } from '../hooks/useLoopProgress'
import { MiniMelodyView } from './MiniMelodyView'
import './EnsembleTimeline.css'

// The fixed "now" head sits a bit left of center so more upcoming tape is
// visible scrolling in from the right.
const PLAYHEAD_FRAC = 0.4
// Seconds of tape visible across the lane, scaled so ~2+ cycles of the
// longest reel show (clamped to stay readable for very short/long loops).
const MIN_WINDOW_SEC = 10
const MAX_WINDOW_SEC = 36

type EnsembleTimelineProps = {
  loops: DemoLoop[]
  runningById: Record<string, boolean>
  motion: TimelineMotion
  zoomStop: number
  /** Called with the reel id when a lane is clicked (jump back to Reels). */
  onSelectLane?: (id: string) => void
}

type RowData = {
  id: string
  label: string
  loop: TapeLoop
  pattern: LoopPattern
  period: number
  melodyWindow: number
  running: boolean
}

function useMeasuredWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }
    const update = () => setWidth(el.clientWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return width
}

type LanePhase = { phase: number; lap: number }

// A wrap is a large backward jump in progress; small backward jitter is not.
const LAP_WRAP_DROP = 0.5
const IDLE_PHASE: LanePhase = { phase: 0, lap: 0 }
// Previous-playhead stand-in handed to a tile that takes over flashing at
// the seam: just before tape start, so the note at column 0 still counts as
// crossed.
const SEAM_FLASH_SEED_SEC = -1e-6

function useTapeLanePhase(loop: TapeLoop, running: boolean): LanePhase {
  const [state, setState] = useState<LanePhase>(IDLE_PHASE)
  useEffect(() => {
    if (!running) {
      return
    }
    let raf = 0
    const frame = () => {
      const p = loop.getProgress()
      setState((s) =>
        p < s.phase - LAP_WRAP_DROP
          ? { phase: p, lap: s.lap + 1 }
          : { phase: p, lap: s.lap },
      )
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      // Reset so stale lap/phase don't flash or fire a spurious downbeat
      // animation on the next play.
      setState(IDLE_PHASE)
    }
  }, [loop, running])
  return running ? state : IDLE_PHASE
}

export function EnsembleTimeline({
  loops,
  runningById,
  motion,
  zoomStop,
  onSelectLane,
}: EnsembleTimelineProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const width = useMeasuredWidth(sectionRef)

  // The tape is laid out at composed (unpaced) scale, so pace shows up as
  // scroll speed rather than rescaling every tile.
  const rows: RowData[] = loops.map((entry) => ({
    id: entry.pattern.id,
    label: entry.pattern.label,
    loop: entry.loop,
    pattern: entry.pattern,
    period: entry.pattern.loopDurationMs / 1000,
    melodyWindow: melodyWindowDuration(entry.pattern.bpm, entry.pattern.loopCols),
    running: runningById[entry.pattern.id] ?? false,
  }))

  const longestPeriod = rows.reduce((max, row) => Math.max(max, row.period), 0)
  const windowSec = Math.min(
    MAX_WINDOW_SEC,
    Math.max(MIN_WINDOW_SEC, longestPeriod * 2.4),
  )
  const pxPerSec = width > 0 ? width / windowSec : 0
  const playheadX = width * PLAYHEAD_FRAC
  const cycles = visibleCycles(
    windowSec,
    medianPeriod(rows.map((row) => row.period)),
  )

  return (
    <section
      ref={sectionRef}
      className="ensemble-timeline"
      aria-label="Ensemble timeline"
    >
      <ul className="ensemble-timeline__rows">
        {rows.map((row) => (
          <TimelineLane
            key={row.id}
            row={row}
            pxPerSec={pxPerSec}
            visibleCycles={cycles}
            motion={motion}
            zoomStop={zoomStop}
            playheadX={playheadX}
            laneWidth={width}
            onSelect={onSelectLane}
          />
        ))}
      </ul>
      {pxPerSec > 0 ? (
        <div
          className="ensemble-timeline__playhead"
          style={{ left: `${playheadX}px` }}
          aria-hidden
        />
      ) : null}
    </section>
  )
}

type TimelineLaneProps = {
  row: RowData
  pxPerSec: number
  visibleCycles: number
  motion: TimelineMotion
  zoomStop: number
  playheadX: number
  laneWidth: number
  onSelect?: (id: string) => void
}

function TimelineLane({
  row,
  pxPerSec,
  visibleCycles,
  motion,
  zoomStop,
  playheadX,
  laneWidth,
  onSelect,
}: TimelineLaneProps) {
  const { phase, lap } = useTapeLanePhase(row.loop, row.running)
  const { lapFlashKey } = useLoopProgress(row.loop, row.running)
  const laneRef = useRef<HTMLLIElement>(null)

  // On each downbeat, pulse the whole lane border (like the Reels row) and
  // bloom the playhead. `lapFlashKey` resets on (re)mount so toggling views
  // mid-playback does not replay the current lap's flash.
  const showDownbeat = row.running && lapFlashKey > 0
  useEffect(() => {
    if (!row.running || lapFlashKey === 0) {
      return
    }
    const el = laneRef.current
    if (!el) {
      return
    }
    el.classList.remove('ensemble-timeline__lane--lap')
    void el.offsetWidth
    el.classList.add('ensemble-timeline__lane--lap')
  }, [lapFlashKey, row.running])

  const tileWidth = laneTileWidth({
    period: row.period,
    pxPerSec,
    laneWidth,
    visibleCycles,
    motion,
    zoomStop,
  })
  const melodyWidth = laneMelodyWidth({
    melodyWindow: row.melodyWindow,
    period: row.period,
    tileWidth,
  })
  // Tiles are indexed by absolute lap so a tile keeps its identity (and any
  // in-flight note flash) when the playhead crosses the seam, instead of
  // being re-purposed for the next lap mid-glow. The strip transform is
  // continuous in (lap + phase).
  const translateX = playheadX - (lap + phase) * tileWidth
  const loopTimeSec = phase * row.period

  // Which tile indices cover the lane. The playhead sits over tile `lap`,
  // so only that tile gets the live loop time and note flashes; the other
  // copies are frame-stable and MiniMelodyView's memo skips re-rendering
  // them.
  const firstIdx =
    tileWidth > 0 ? Math.floor((0 - translateX) / tileWidth) - 1 : 0
  const lastIdx =
    tileWidth > 0 ? Math.ceil((laneWidth - translateX) / tileWidth) + 1 : -1

  const tiles = useMemo(() => {
    if (tileWidth <= 0) {
      return null
    }
    const items = []
    for (let i = firstIdx; i <= lastIdx; i += 1) {
      const isPlayheadTile = i === lap
      items.push(
        <div
          key={i}
          className="ensemble-timeline__tile"
          style={{ left: `${i * tileWidth}px`, width: `${tileWidth}px` }}
        >
          <div className="ensemble-timeline__seam" />
          <div
            className="ensemble-timeline__tile-melody"
            style={{ width: `${melodyWidth}px` }}
          >
            <MiniMelodyView
              pattern={row.pattern}
              loopTimeSec={isPlayheadTile ? loopTimeSec : 0}
              showPlayhead={false}
              flashNotes={row.running && isPlayheadTile}
              periodSec={row.period}
              flashSeedSec={
                isPlayheadTile && lap > 0 ? SEAM_FLASH_SEED_SEC : null
              }
            />
          </div>
        </div>,
      )
    }
    return items
  }, [firstIdx, lastIdx, lap, tileWidth, melodyWidth, row.pattern, loopTimeSec, row.period, row.running])

  const interactive = onSelect != null

  return (
    <li
      ref={laneRef}
      className={`ensemble-timeline__lane${interactive ? ' is-clickable' : ''}`}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={
        interactive ? `Open ${row.label} in reels view` : row.label
      }
      title={interactive ? 'click to open in reels view' : undefined}
      onClick={interactive ? () => onSelect(row.id) : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect(row.id)
              }
            }
          : undefined
      }
    >
      {tiles ? (
        <div
          className="ensemble-timeline__strip"
          style={{ transform: `translateX(${translateX}px)` }}
        >
          {tiles}
        </div>
      ) : null}
      {row.pattern.notes.length === 0 ? (
        <span className="ensemble-timeline__empty">empty reel</span>
      ) : null}
      {showDownbeat ? (
        <span
          key={lapFlashKey}
          className="ensemble-timeline__downbeat"
          style={{ left: `${playheadX}px` }}
          aria-hidden
        />
      ) : null}
      <span className="ensemble-timeline__period">
        {row.label} · {formatDisplayLoopDuration(row.period)}s
      </span>
    </li>
  )
}
