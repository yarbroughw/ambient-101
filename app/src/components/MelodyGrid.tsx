import { useEffect, useMemo, useRef, useState } from 'react'
import { previewGridNote } from '../audio/previewGridNote'
import type { LoopPattern, PatternNote } from '../audio/patternTypes'
import {
  cellStartTime,
  columnAtClientX,
  findNoteAt,
  gridLayout,
  gridPlayheadRatio,
  noteCoversCell,
  noteEndColumn,
  noteKey,
  noteStartColumn,
  noteColumnSpan,
  placeNoteSpan,
  removeNote,
  resizeNoteEnd,
  type GridPointerMetrics,
} from '../lib/gridLayout'
import { gridScaleRows, stepToPitch } from '../lib/scaleSteps'
import './MelodyGrid.css'

type MelodyGridProps = {
  pattern: Pick<LoopPattern, 'notes' | 'scale' | 'octaveShift' | 'instrument'>
  loopTimeSec: number
  showPlayhead: boolean
  bpm: number
  disabled?: boolean
  onNotesChange: (notes: PatternNote[]) => void
}

type PaintDrag = {
  kind: 'paint'
  scaleStep: number
  anchorCol: number
  currentCol: number
}

type ResizeDrag = {
  kind: 'resize'
  note: PatternNote
  startCol: number
  currentEndCol: number
}

type DragState = PaintDrag | ResizeDrag

type GridCellTarget = {
  scaleStep: number
  col: number
}

function cellFromTarget(target: EventTarget | null): GridCellTarget | null {
  if (!(target instanceof HTMLElement)) {
    return null
  }

  const cell = target.closest('[data-grid-cell]')
  if (!(cell instanceof HTMLElement)) {
    return null
  }

  const scaleStep = Number(cell.dataset.scaleStep)
  const col = Number(cell.dataset.col)
  if (!Number.isFinite(scaleStep) || !Number.isFinite(col)) {
    return null
  }

  return { scaleStep, col }
}

function cellAtPoint(clientX: number, clientY: number): GridCellTarget | null {
  const element = document.elementFromPoint(clientX, clientY)
  return cellFromTarget(element)
}

export function MelodyGrid({
  pattern,
  loopTimeSec,
  showPlayhead,
  bpm,
  disabled = false,
  onNotesChange,
}: MelodyGridProps) {
  const { notes, scale, octaveShift, instrument } = pattern
  const layout = useMemo(() => gridLayout(bpm), [bpm])
  const rows = useMemo(
    () => gridScaleRows(scale, octaveShift),
    [scale, octaveShift],
  )
  const playheadRatio = gridPlayheadRatio(loopTimeSec, layout.gridDuration)
  const [drag, setDrag] = useState<DragState | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const notesRef = useRef(notes)
  const stepSecRef = useRef(layout.stepSec)
  const onNotesChangeRef = useRef(onNotesChange)
  const patternRef = useRef({ scale, octaveShift, instrument })
  notesRef.current = notes
  stepSecRef.current = layout.stepSec
  onNotesChangeRef.current = onNotesChange
  patternRef.current = { scale, octaveShift, instrument }

  function previewStep(scaleStep: number, durationSec: number) {
    const { scale: s, octaveShift: o, instrument: i } = patternRef.current
    previewGridNote(stepToPitch(s, scaleStep, o), durationSec, i)
  }

  function endDrag() {
    dragRef.current = null
    setDrag(null)
  }

  function pointerMetrics(): GridPointerMetrics | null {
    const grid = gridRef.current
    if (!grid) {
      return null
    }

    const styles = getComputedStyle(grid)
    const labelWidth =
      Number.parseFloat(styles.getPropertyValue('--melody-grid-label-width')) || 52
    const cellSize =
      Number.parseFloat(styles.getPropertyValue('--melody-grid-cell-size')) || 13

    return {
      columnCount: layout.columnCount,
      labelWidth,
      cellSize,
      gap: 1,
    }
  }

  function columnAtPointer(clientX: number): number | null {
    const grid = gridRef.current
    const metrics = pointerMetrics()
    if (!grid || !metrics) {
      return null
    }

    return columnAtClientX(clientX, grid.getBoundingClientRect(), metrics)
  }

  useEffect(() => {
    if (!drag) {
      return
    }

    function handlePointerMove(event: PointerEvent) {
      const active = dragRef.current
      if (!active) {
        return
      }

      if (active.kind === 'paint') {
        const cell = cellAtPoint(event.clientX, event.clientY)
        if (!cell || cell.scaleStep !== active.scaleStep) {
          return
        }
        const next: PaintDrag = { ...active, currentCol: cell.col }
        dragRef.current = next
        setDrag(next)
        return
      }

      const col = columnAtPointer(event.clientX)
      if (col === null) {
        return
      }

      const endCol = Math.max(active.startCol, col)
      const next: ResizeDrag = { ...active, currentEndCol: endCol }
      dragRef.current = next
      setDrag(next)
    }

    function handlePointerUp() {
      const active = dragRef.current
      if (!active) {
        return
      }

      const stepSec = stepSecRef.current
      const currentNotes = notesRef.current

      if (active.kind === 'paint') {
        const nextNotes = placeNoteSpan(
          currentNotes,
          active.scaleStep,
          active.anchorCol,
          active.currentCol,
          stepSec,
        )
        onNotesChangeRef.current(nextNotes)

        const minCol = Math.min(active.anchorCol, active.currentCol)
        const maxCol = Math.max(active.anchorCol, active.currentCol)
        previewStep(active.scaleStep, (maxCol - minCol + 1) * stepSec)
      } else {
        onNotesChangeRef.current(
          resizeNoteEnd(
            currentNotes,
            active.note,
            active.currentEndCol,
            stepSec,
          ),
        )
      }

      endDrag()
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [drag])

  function handleCellPointerDown(
    scaleStep: number,
    col: number,
    event: React.PointerEvent<HTMLButtonElement>,
  ) {
    if (disabled || findNoteAt(notes, scaleStep, col, layout.stepSec)) {
      return
    }

    event.preventDefault()
    const paint: PaintDrag = {
      kind: 'paint',
      scaleStep,
      anchorCol: col,
      currentCol: col,
    }
    dragRef.current = paint
    setDrag(paint)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleResizePointerDown(
    note: PatternNote,
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    if (disabled) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const startCol = noteStartColumn(note, layout.stepSec)
    const resize: ResizeDrag = {
      kind: 'resize',
      note,
      startCol,
      currentEndCol: noteEndColumn(note, layout.stepSec),
    }
    dragRef.current = resize
    setDrag(resize)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleBarClick(note: PatternNote, event: React.MouseEvent) {
    if (disabled) {
      return
    }

    event.stopPropagation()
    onNotesChange(removeNote(notes, note))
  }

  function handleCellKeyDown(
    scaleStep: number,
    col: number,
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) {
    if (disabled || (event.key !== ' ' && event.key !== 'Enter')) {
      return
    }

    event.preventDefault()
    const existing = findNoteAt(notes, scaleStep, col, layout.stepSec)
    if (existing) {
      onNotesChange(removeNote(notes, existing))
      return
    }

    const nextNotes = placeNoteSpan(notes, scaleStep, col, col, layout.stepSec)
    onNotesChange(nextNotes)
    previewStep(scaleStep, layout.stepSec)
  }

  function barSpanForNote(note: PatternNote): number {
    const resizing =
      drag?.kind === 'resize' && noteKey(drag.note) === noteKey(note)
    if (resizing) {
      return drag.currentEndCol - drag.startCol + 1
    }
    return noteColumnSpan(note, layout.stepSec)
  }

  function ghostPaintForRow(scaleStep: number): PaintDrag | null {
    if (drag?.kind !== 'paint' || drag.scaleStep !== scaleStep) {
      return null
    }
    return drag
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
          ref={gridRef}
          className="melody-grid"
          role="grid"
          aria-label="Melody step grid"
          style={{
            gridTemplateColumns: `var(--melody-grid-label-width) repeat(${layout.columnCount}, var(--melody-grid-cell-size))`,
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

          {rows.map((row, rowIndex) => {
            const gridRow = rowIndex + 2
            const rowNotes = notes.filter((note) => note.scaleStep === row.scaleStep)
            const ghost = ghostPaintForRow(row.scaleStep)

            return (
              <div key={row.scaleStep} className="melody-grid__row" role="row">
                <div
                  className={`melody-grid__row-label${row.scaleStep === 0 ? ' melody-grid__row-label--root' : ''}`}
                  role="rowheader"
                  style={{ gridRow, gridColumn: 1 }}
                >
                  <span className="melody-grid__row-pitch">{row.pitchName}</span>
                  <span className="melody-grid__row-step">{row.stepLabel}</span>
                </div>

                {Array.from({ length: layout.columnCount }, (_, col) => {
                  const startTime = cellStartTime(col, layout.stepSec)
                  const covered = notes.some((note) =>
                    noteCoversCell(note, row.scaleStep, col, layout.stepSec),
                  )

                  return (
                    <button
                      key={`${row.scaleStep}-${col}`}
                      type="button"
                      className="melody-grid__cell"
                      role="gridcell"
                      data-grid-cell
                      data-scale-step={row.scaleStep}
                      data-col={col}
                      style={{ gridRow, gridColumn: col + 2 }}
                      aria-selected={covered}
                      aria-label={`${row.stepLabel} ${row.pitchName} at ${startTime.toFixed(2)} seconds`}
                      disabled={disabled}
                      onPointerDown={(event) =>
                        handleCellPointerDown(row.scaleStep, col, event)
                      }
                      onKeyDown={(event) =>
                        handleCellKeyDown(row.scaleStep, col, event)
                      }
                    />
                  )
                })}

                {rowNotes.map((note) => {
                  const startCol = noteStartColumn(note, layout.stepSec)
                  const span = barSpanForNote(note)
                  const resizing =
                    drag?.kind === 'resize' &&
                    noteKey(drag.note) === noteKey(note)

                  return (
                    <div
                      key={noteKey(note)}
                      className={`melody-grid__bar${resizing ? ' melody-grid__bar--resizing' : ''}`}
                      style={{
                        gridRow,
                        gridColumn: `${startCol + 2} / span ${span}`,
                      }}
                    >
                      <button
                        type="button"
                        className="melody-grid__bar-body"
                        aria-label={`Remove note at step ${row.stepLabel}`}
                        disabled={disabled}
                        onClick={(event) => handleBarClick(note, event)}
                      />
                      <div
                        className="melody-grid__bar-handle"
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={`Extend note at step ${row.stepLabel}`}
                        onPointerDown={(event) =>
                          handleResizePointerDown(note, event)
                        }
                      />
                    </div>
                  )
                })}

                {ghost ? (
                  <div
                    className="melody-grid__bar melody-grid__bar--ghost"
                    aria-hidden
                    style={{
                      gridRow,
                      gridColumn: `${Math.min(ghost.anchorCol, ghost.currentCol) + 2} / span ${Math.abs(ghost.currentCol - ghost.anchorCol) + 1}`,
                    }}
                  />
                ) : null}
              </div>
            )
          })}
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
