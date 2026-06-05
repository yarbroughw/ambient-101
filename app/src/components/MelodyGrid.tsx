import { useMemo } from 'react'
import type { PatternNote } from '../audio/patternTypes'
import {
  cellStartTime,
  gridLayout,
  gridPlayheadRatio,
  noteCoversCell,
  toggleNoteAtCell,
} from '../lib/gridLayout'
import { gridRows, type ScalePresentation } from '../lib/scaleRows'
import './MelodyGrid.css'

type MelodyGridProps = {
  notes: PatternNote[]
  loopTimeSec: number
  showPlayhead: boolean
  bpm: number
  scale: string
  presentation: ScalePresentation
  disabled?: boolean
  onNotesChange: (notes: PatternNote[]) => void
}

export function MelodyGrid({
  notes,
  loopTimeSec,
  showPlayhead,
  bpm,
  scale,
  presentation,
  disabled = false,
  onNotesChange,
}: MelodyGridProps) {
  const layout = useMemo(() => gridLayout(bpm), [bpm])
  const rows = useMemo(
    () => gridRows(scale, notes, presentation),
    [scale, notes, presentation],
  )
  const playheadRatio = gridPlayheadRatio(loopTimeSec, layout.gridDuration)

  function handleToggle(pitch: string, col: number) {
    if (disabled) {
      return
    }
    onNotesChange(toggleNoteAtCell(notes, pitch, col, layout.stepSec))
  }

  return (
    <div className="melody-grid__scroll">
      <div
        className="melody-grid__frame"
        style={{
          ['--melody-grid-column-count' as string]: layout.columnCount,
        }}
      >
        <div
          className="melody-grid"
          role="grid"
          aria-label="Melody step grid"
          style={{
            gridTemplateColumns: `44px repeat(${layout.columnCount}, var(--melody-grid-cell-size))`,
          }}
        >
        <div className="melody-grid__corner" role="presentation" />
        {Array.from({ length: layout.columnCount }, (_, col) => (
          <div
            key={`col-${col}`}
            className="melody-grid__col-header"
            role="columnheader"
            aria-label={`Step ${col + 1}`}
          >
            {col % 16 === 0 ? col / 16 + 1 : col % 4 === 0 ? '·' : ''}
          </div>
        ))}

        {rows.map((row) => (
          <div key={row.pitch} className="melody-grid__row" role="row">
            <div
              className={`melody-grid__row-label${row.inScale ? '' : ' melody-grid__row-label--extra'}`}
              role="rowheader"
            >
              {row.pitch}
            </div>
            {Array.from({ length: layout.columnCount }, (_, col) => {
              const active = notes.some((note) =>
                noteCoversCell(note, row.pitch, col, layout.stepSec),
              )
              const startTime = cellStartTime(col, layout.stepSec)

              return (
                <button
                  key={`${row.pitch}-${col}`}
                  type="button"
                  className={`melody-grid__cell${active ? ' melody-grid__cell--active' : ''}${row.inScale ? '' : ' melody-grid__cell--chromatic'}`}
                  role="gridcell"
                  aria-selected={active}
                  aria-label={`${row.pitch} at ${startTime.toFixed(2)} seconds`}
                  disabled={disabled}
                  onClick={() => handleToggle(row.pitch, col)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault()
                      handleToggle(row.pitch, col)
                    }
                  }}
                />
              )
            })}
          </div>
        ))}
        </div>

        {showPlayhead && playheadRatio !== null ? (
          <div className="melody-grid__playhead-layer" aria-hidden>
            <span
              className="melody-grid__playhead"
              style={{ left: `${playheadRatio * 100}%` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
