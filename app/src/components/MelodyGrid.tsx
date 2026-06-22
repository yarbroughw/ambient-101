import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { previewGridNote } from '../audio/previewGridNote'
import type { LoopPattern, PatternNote } from '../audio/patternTypes'
import {
  GRID_COLUMN_COUNT,
  cellStartTime,
  columnAtClientXMeasured,
  findNoteAt,
  gridLayout,
  gridPlayheadRatio,
  moveNote,
  noteEndColumn,
  noteKey,
  placeNoteSpan,
  removeNote,
  resizeNoteEnd,
  resizeNoteStart,
  rowAtClientYMeasured,
  type GridPointerMetrics,
} from '../lib/gridLayout'
import { GRID_SCALE_STEP_MAX, GRID_SCALE_STEP_MIN, gridScaleRows, stepToPitch } from '../lib/scaleSteps'
import { usePlayheadNoteFlashes } from '../hooks/usePlayheadNoteFlashes'
import './MelodyGrid.css'

type MelodyGridProps = {
  pattern: Pick<LoopPattern, 'notes' | 'root' | 'scale' | 'octaveShift' | 'instrument'>
  loopTimeSec: number
  showPlayhead: boolean
  bpm: number
  loopCols: number
  periodSec: number
  disabled?: boolean
  onNotesChange: (notes: PatternNote[]) => void
  onLoopColsChange: (loopCols: number) => void
}

type PaintDrag = {
  kind: 'paint'
  scaleStep: number
  anchorCol: number
  currentCol: number
}

type ResizeEndDrag = {
  kind: 'resize-end'
  note: PatternNote
  originEndCol: number
  anchorCol: number
  currentEndCol: number
}

type ResizeStartDrag = {
  kind: 'resize-start'
  note: PatternNote
  originStartCol: number
  originEndCol: number
  anchorCol: number
  currentStartCol: number
}

type MoveDrag = {
  kind: 'move'
  note: PatternNote
  originStartCol: number
  originScaleStep: number
  anchorCol: number
  anchorRowIndex: number
  currentCol: number
  currentRowIndex: number
  didMove: boolean
  lastPreviewedRowIndex: number
}

type BraceDrag = {
  kind: 'brace'
  // Relative drag: applying a delta to the grab-time loopCols means zero
  // movement is zero change (absolute pointer→column mapping jumped on grab).
  startX: number
  startCols: number
}

type DragState = PaintDrag | ResizeEndDrag | ResizeStartDrag | MoveDrag | BraceDrag

type GridCellTarget = {
  scaleStep: number
  col: number
}

type NoteDisplay = {
  note: PatternNote
  startCol: number
  span: number
  scaleStep: number
  isActive: boolean
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

// ---- inner component — only re-renders when data changes, not on every animation frame ----

type MelodyGridBodyProps = {
  notes: PatternNote[]
  rows: ReturnType<typeof gridScaleRows>
  layout: ReturnType<typeof gridLayout>
  activeCols: number
  disabled: boolean
  noteFlashes: Record<string, number>
  drag: DragState | null
  hoveredScaleStep: number | null
  gridRef: React.RefObject<HTMLDivElement | null>
  setHoveredScaleStep: React.Dispatch<React.SetStateAction<number | null>>
  onCellPointerDown: (scaleStep: number, col: number, event: React.PointerEvent<HTMLButtonElement>) => void
  onCellKeyDown: (scaleStep: number, col: number, event: React.KeyboardEvent<HTMLButtonElement>) => void
  onResizeEndPointerDown: (note: PatternNote, event: React.PointerEvent<HTMLDivElement>) => void
  onResizeStartPointerDown: (note: PatternNote, event: React.PointerEvent<HTMLDivElement>) => void
  onMovePointerDown: (note: PatternNote, event: React.PointerEvent<HTMLButtonElement>) => void
  onBracePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
  onLoopColsChange: (cols: number) => void
}

const MelodyGridBody = memo(function MelodyGridBody({
  notes,
  rows,
  layout,
  activeCols,
  disabled,
  noteFlashes,
  drag,
  hoveredScaleStep,
  gridRef,
  setHoveredScaleStep,
  onCellPointerDown,
  onCellKeyDown,
  onResizeEndPointerDown,
  onResizeStartPointerDown,
  onMovePointerDown,
  onBracePointerDown,
  onLoopColsChange,
}: MelodyGridBodyProps) {
  // O(1) lookup per cell instead of O(notes) — recomputed only when notes change
  const occupied = useMemo(() => {
    const set = new Set<string>()
    for (const note of notes) {
      for (let col = note.startCol; col < note.startCol + note.spanCols; col++) {
        set.add(`${note.scaleStep}:${col}`)
      }
    }
    return set
  }, [notes])

  function displayStateForNote(note: PatternNote): NoteDisplay {
    if (drag?.kind === 'resize-end' && noteKey(drag.note) === noteKey(note)) {
      return {
        note,
        startCol: note.startCol,
        span: drag.currentEndCol - note.startCol + 1,
        scaleStep: note.scaleStep,
        isActive: true,
      }
    }

    if (drag?.kind === 'resize-start' && noteKey(drag.note) === noteKey(note)) {
      return {
        note,
        startCol: drag.currentStartCol,
        span: drag.originEndCol - drag.currentStartCol + 1,
        scaleStep: note.scaleStep,
        isActive: true,
      }
    }

    if (drag?.kind === 'move' && noteKey(drag.note) === noteKey(note)) {
      const deltaCol = drag.currentCol - drag.anchorCol
      const deltaStep = drag.anchorRowIndex - drag.currentRowIndex
      return {
        note,
        startCol: Math.min(
          GRID_COLUMN_COUNT - note.spanCols,
          Math.max(0, drag.originStartCol + deltaCol),
        ),
        span: note.spanCols,
        scaleStep: Math.min(
          GRID_SCALE_STEP_MAX,
          Math.max(GRID_SCALE_STEP_MIN, drag.originScaleStep + deltaStep),
        ),
        isActive: true,
      }
    }

    return {
      note,
      startCol: note.startCol,
      span: note.spanCols,
      scaleStep: note.scaleStep,
      isActive: false,
    }
  }

  const activeScaleStep =
    drag?.kind === 'paint' ? drag.scaleStep : hoveredScaleStep

  return (
    <>
      <div
        ref={gridRef}
        className="melody-grid melody-grid--fluid"
        role="grid"
        aria-label="Melody step grid"
        style={{
          gridTemplateColumns: `var(--melody-grid-step-width) repeat(${layout.columnCount}, minmax(0, 1fr)) var(--melody-grid-pitch-width)`,
        }}
      >
        <div className="melody-grid__corner melody-grid__corner--step" role="presentation" />
        {Array.from({ length: layout.columnCount }, (_, col) => (
          <div
            key={`col-${col}`}
            className={
              col >= activeCols
                ? 'melody-grid__col-header melody-grid__col-header--inactive'
                : 'melody-grid__col-header'
            }
            role="columnheader"
            aria-label={`Step ${col + 1}`}
          >
            {col % 16 === 0 ? col / 16 + 1 : col % 4 === 0 ? '·' : ''}
          </div>
        ))}
        <div className="melody-grid__corner melody-grid__corner--pitch" role="presentation" />

        {rows.map((row, rowIndex) => {
          const gridRow = rowIndex + 2
          const rowDisplays = notes
            .map((note) => displayStateForNote(note))
            .filter((display) => display.scaleStep === row.scaleStep)
          const ghost =
            drag?.kind === 'paint' && drag.scaleStep === row.scaleStep ? drag : null
          const rowHighlighted = activeScaleStep === row.scaleStep
          const labelClass = rowHighlighted
            ? 'melody-grid__axis-label melody-grid__axis-label--active'
            : 'melody-grid__axis-label'
          const rootClass =
            row.scaleStep === 0 ? ' melody-grid__axis-label--root' : ''

          return (
            <div key={row.scaleStep} className="melody-grid__row" role="row">
              <div
                className={`${labelClass} melody-grid__axis-label--step${rootClass}`}
                role="rowheader"
                style={{ gridRow, gridColumn: 1 }}
              >
                <span className="melody-grid__row-step">{row.stepLabel}</span>
              </div>

              {Array.from({ length: layout.columnCount }, (_, col) => {
                const startTime = cellStartTime(col, layout.stepSec)
                const covered = occupied.has(`${row.scaleStep}:${col}`)

                return (
                  <button
                    key={`${row.scaleStep}-${col}`}
                    type="button"
                    className={
                      col >= activeCols
                        ? 'melody-grid__cell melody-grid__cell--inactive'
                        : 'melody-grid__cell'
                    }
                    role="gridcell"
                    data-grid-cell
                    data-scale-step={row.scaleStep}
                    data-col={col}
                    style={{ gridRow, gridColumn: col + 2 }}
                    aria-selected={covered}
                    aria-label={`${row.stepLabel} ${row.pitchName} at ${startTime.toFixed(2)} seconds`}
                    disabled={disabled}
                    onPointerDown={(event) =>
                      onCellPointerDown(row.scaleStep, col, event)
                    }
                    onKeyDown={(event) =>
                      onCellKeyDown(row.scaleStep, col, event)
                    }
                    onMouseEnter={() => setHoveredScaleStep(row.scaleStep)}
                    onMouseLeave={() =>
                      setHoveredScaleStep((current) =>
                        current === row.scaleStep ? null : current,
                      )
                    }
                    onFocus={() => setHoveredScaleStep(row.scaleStep)}
                    onBlur={() =>
                      setHoveredScaleStep((current) =>
                        current === row.scaleStep ? null : current,
                      )
                    }
                  />
                )
              })}

              <div
                className={`${labelClass} melody-grid__axis-label--pitch${rootClass}`}
                role="rowheader"
                style={{
                  gridRow,
                  gridColumn: layout.columnCount + 2,
                }}
              >
                <span className="melody-grid__row-pitch">{row.pitchName}</span>
              </div>

              {rowDisplays.map((display) => {
                const flashCount = noteFlashes[noteKey(display.note)] ?? 0
                const barClass = [
                  'melody-grid__bar',
                  display.isActive ? 'melody-grid__bar--active' : '',
                  flashCount > 0 ? 'melody-grid__bar--flash' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <div
                    key={`${noteKey(display.note)}-${flashCount}`}
                    className={barClass}
                    style={{
                      gridRow,
                      gridColumn: `${display.startCol + 2} / span ${display.span}`,
                    }}
                  >
                    <div
                      className="melody-grid__bar-handle melody-grid__bar-handle--start"
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Extend note start at step ${row.stepLabel}`}
                      onPointerDown={(event) =>
                        onResizeStartPointerDown(display.note, event)
                      }
                    />
                    <button
                      type="button"
                      className="melody-grid__bar-body"
                      aria-label={`Move or remove note at step ${row.stepLabel}`}
                      disabled={disabled}
                      onPointerDown={(event) =>
                        onMovePointerDown(display.note, event)
                      }
                    />
                    <div
                      className="melody-grid__bar-handle melody-grid__bar-handle--end"
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Extend note end at step ${row.stepLabel}`}
                      onPointerDown={(event) =>
                        onResizeEndPointerDown(display.note, event)
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

      <div className="melody-grid__brace">
        <div
          className="melody-grid__brace-handle"
          role="slider"
          aria-label="Loop length in steps"
          aria-valuemin={1}
          aria-valuemax={layout.columnCount}
          aria-valuenow={activeCols}
          aria-valuetext={`${activeCols} steps`}
          title="loop end — drag to shorten the melody"
          tabIndex={disabled ? -1 : 0}
          onPointerDown={onBracePointerDown}
          onKeyDown={(event) => {
            if (disabled) {
              return
            }
            if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
              event.preventDefault()
              onLoopColsChange(Math.max(1, activeCols - 1))
            } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
              event.preventDefault()
              onLoopColsChange(Math.min(layout.columnCount, activeCols + 1))
            }
          }}
        />
      </div>
    </>
  )
})

// ---- outer component — re-renders 60fps but MelodyGridBody is memo'd ----

export function MelodyGrid({
  pattern,
  loopTimeSec,
  showPlayhead,
  bpm,
  loopCols,
  periodSec,
  disabled = false,
  onNotesChange,
  onLoopColsChange,
}: MelodyGridProps) {
  const { notes, root, scale, octaveShift, instrument } = pattern
  const tonality = useMemo(() => ({ root, scale }), [root, scale])
  const layout = useMemo(() => gridLayout(bpm, loopCols), [bpm, loopCols])
  const activeCols = layout.loopCols
  const noteFlashes = usePlayheadNoteFlashes(
    loopTimeSec,
    notes,
    bpm,
    periodSec,
    showPlayhead && periodSec > 0,
  )
  const rows = useMemo(
    () => gridScaleRows(tonality, octaveShift),
    [tonality, octaveShift],
  )
  const playheadRatio = gridPlayheadRatio(loopTimeSec, layout.gridDuration)

  const [drag, setDrag] = useState<DragState | null>(null)
  const [hoveredScaleStep, setHoveredScaleStep] = useState<number | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const notesRef = useRef(notes)
  const rowsRef = useRef(rows)
  const layoutRef = useRef(layout)
  const stepSecRef = useRef(layout.stepSec)
  const onNotesChangeRef = useRef(onNotesChange)
  const onLoopColsChangeRef = useRef(onLoopColsChange)
  const activeColsRef = useRef(activeCols)
  const patternRef = useRef({ tonality, octaveShift, instrument })
  const disabledRef = useRef(disabled)
  useEffect(() => {
    notesRef.current = notes
    rowsRef.current = rows
    layoutRef.current = layout
    stepSecRef.current = layout.stepSec
    onNotesChangeRef.current = onNotesChange
    onLoopColsChangeRef.current = onLoopColsChange
    activeColsRef.current = activeCols
    patternRef.current = { tonality, octaveShift, instrument }
    disabledRef.current = disabled
  })

  const stableOnLoopColsChange = useCallback((cols: number) => {
    onLoopColsChangeRef.current(cols)
  }, [])

  const previewStep = useCallback((scaleStep: number, durationSec: number) => {
    const { tonality: t, octaveShift: o, instrument: i } = patternRef.current
    previewGridNote(stepToPitch(t, scaleStep, o), durationSec, i)
  }, [])

  const endDrag = useCallback(() => {
    dragRef.current = null
    setDrag(null)
  }, [])

  const pointerMetrics = useCallback((): GridPointerMetrics | null => {
    const grid = gridRef.current
    if (!grid) {
      return null
    }

    const firstCell = grid.querySelector<HTMLElement>('[data-grid-cell]')
    if (!firstCell) {
      return null
    }

    const cellRect = firstCell.getBoundingClientRect()
    const styles = getComputedStyle(grid)
    const labelWidth =
      Number.parseFloat(styles.getPropertyValue('--melody-grid-step-width')) || 26
    const gap = Number.parseFloat(styles.gap) || 1

    // Measure the rendered cell so the stride matches pointer coordinates even
    // under the root `zoom` transform, which CSS-variable widths ignore.
    return {
      columnCount: layoutRef.current.columnCount,
      labelWidth,
      cellSize: cellRect.width,
      gap,
    }
  }, [])

  const columnAtPointer = useCallback((clientX: number): number | null => {
    const grid = gridRef.current
    if (!grid) {
      return null
    }

    const firstCell = grid.querySelector<HTMLElement>('[data-grid-cell]')
    if (!firstCell) {
      return null
    }

    const cellRect = firstCell.getBoundingClientRect()
    const styles = getComputedStyle(grid)
    const gap = Number.parseFloat(styles.gap) || 1

    return columnAtClientXMeasured(clientX, {
      dataLeft: cellRect.left,
      colWidth: cellRect.width + gap,
      columnCount: layoutRef.current.columnCount,
    })
  }, [])

  const rowAtPointer = useCallback((clientY: number): number | null => {
    const grid = gridRef.current
    if (!grid) {
      return null
    }

    const firstCell = grid.querySelector<HTMLElement>('[data-grid-cell]')
    if (!firstCell) {
      return null
    }

    const cellRect = firstCell.getBoundingClientRect()
    const styles = getComputedStyle(grid)
    const gap = Number.parseFloat(styles.gap) || 1

    return rowAtClientYMeasured(clientY, {
      dataTop: cellRect.top,
      rowHeight: cellRect.height + gap,
      rowCount: rowsRef.current.length,
    })
  }, [])

  const handleCellPointerDown = useCallback(
    (
      scaleStep: number,
      col: number,
      event: React.PointerEvent<HTMLButtonElement>,
    ) => {
      if (disabledRef.current || findNoteAt(notesRef.current, scaleStep, col)) {
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
    },
    [],
  )

  const handleResizeEndPointerDown = useCallback(
    (note: PatternNote, event: React.PointerEvent<HTMLDivElement>) => {
      if (disabledRef.current) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const anchorCol = columnAtPointer(event.clientX) ?? noteEndColumn(note)
      const resize: ResizeEndDrag = {
        kind: 'resize-end',
        note,
        originEndCol: noteEndColumn(note),
        anchorCol,
        currentEndCol: noteEndColumn(note),
      }
      dragRef.current = resize
      setDrag(resize)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [columnAtPointer],
  )

  const handleResizeStartPointerDown = useCallback(
    (note: PatternNote, event: React.PointerEvent<HTMLDivElement>) => {
      if (disabledRef.current) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const anchorCol = columnAtPointer(event.clientX) ?? note.startCol
      const resize: ResizeStartDrag = {
        kind: 'resize-start',
        note,
        originStartCol: note.startCol,
        originEndCol: noteEndColumn(note),
        anchorCol,
        currentStartCol: note.startCol,
      }
      dragRef.current = resize
      setDrag(resize)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [columnAtPointer],
  )

  const handleMovePointerDown = useCallback(
    (note: PatternNote, event: React.PointerEvent<HTMLButtonElement>) => {
      if (disabledRef.current) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const col = columnAtPointer(event.clientX)
      if (col === null) {
        return
      }

      const rowIndex = rowsRef.current.findIndex(
        (row) => row.scaleStep === note.scaleStep,
      )
      if (rowIndex < 0) {
        return
      }

      const move: MoveDrag = {
        kind: 'move',
        note,
        originStartCol: note.startCol,
        originScaleStep: note.scaleStep,
        anchorCol: col,
        anchorRowIndex: rowIndex,
        currentCol: col,
        currentRowIndex: rowIndex,
        didMove: false,
        lastPreviewedRowIndex: rowIndex,
      }
      dragRef.current = move
      setDrag(move)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [columnAtPointer, rowAtPointer],
  )

  const handleBracePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabledRef.current) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const brace: BraceDrag = {
        kind: 'brace',
        startX: event.clientX,
        startCols: activeColsRef.current,
      }
      dragRef.current = brace
      setDrag(brace)
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    [],
  )

  const handleCellKeyDown = useCallback(
    (
      scaleStep: number,
      col: number,
      event: React.KeyboardEvent<HTMLButtonElement>,
    ) => {
      if (disabledRef.current || (event.key !== ' ' && event.key !== 'Enter')) {
        return
      }

      event.preventDefault()
      const existing = findNoteAt(notesRef.current, scaleStep, col)
      if (existing) {
        onNotesChangeRef.current(removeNote(notesRef.current, existing))
        return
      }

      const nextNotes = placeNoteSpan(notesRef.current, scaleStep, col, col)
      onNotesChangeRef.current(nextNotes)
      previewStep(scaleStep, stepSecRef.current)
    },
    [previewStep],
  )

  useEffect(() => {
    if (!drag) {
      return
    }

    function handlePointerMove(event: PointerEvent) {
      const active = dragRef.current
      if (!active) {
        return
      }

      event.preventDefault()

      if (active.kind === 'brace') {
        const metrics = pointerMetrics()
        if (!metrics) {
          return
        }
        const deltaCols = Math.round(
          (event.clientX - active.startX) / (metrics.cellSize + metrics.gap),
        )
        const nextCols = Math.min(
          GRID_COLUMN_COUNT,
          Math.max(1, active.startCols + deltaCols),
        )
        if (nextCols !== activeColsRef.current) {
          activeColsRef.current = nextCols
          onLoopColsChangeRef.current(nextCols)
        }
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

      if (active.kind === 'move') {
        const col = columnAtPointer(event.clientX)
        const rowIndex = rowAtPointer(event.clientY)
        if (col === null || rowIndex === null) {
          return
        }

        const didMove =
          active.didMove ||
          col !== active.anchorCol ||
          rowIndex !== active.anchorRowIndex

        const next: MoveDrag = {
          ...active,
          currentCol: col,
          currentRowIndex: rowIndex,
          didMove,
          lastPreviewedRowIndex: active.lastPreviewedRowIndex,
        }

        if (rowIndex !== active.lastPreviewedRowIndex) {
          const row = rowsRef.current[rowIndex]
          if (row) {
            previewStep(row.scaleStep, stepSecRef.current * active.note.spanCols)
          }
          next.lastPreviewedRowIndex = rowIndex
        }

        dragRef.current = next
        setDrag(next)
        return
      }

      const col = columnAtPointer(event.clientX)
      if (col === null) {
        return
      }

      if (active.kind === 'resize-end') {
        const delta = col - active.anchorCol
        const endCol = Math.min(
          GRID_COLUMN_COUNT - 1,
          Math.max(active.note.startCol, active.originEndCol + delta),
        )
        const next: ResizeEndDrag = { ...active, currentEndCol: endCol }
        dragRef.current = next
        setDrag(next)
        return
      }

      const delta = col - active.anchorCol
      const startCol = Math.min(
        active.originEndCol,
        Math.max(0, active.originStartCol + delta),
      )
      const next: ResizeStartDrag = { ...active, currentStartCol: startCol }
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

      if (active.kind === 'brace') {
        endDrag()
        return
      }

      if (active.kind === 'paint') {
        const nextNotes = placeNoteSpan(
          currentNotes,
          active.scaleStep,
          active.anchorCol,
          active.currentCol,
        )
        onNotesChangeRef.current(nextNotes)

        const minCol = Math.min(active.anchorCol, active.currentCol)
        const maxCol = Math.max(active.anchorCol, active.currentCol)
        previewStep(active.scaleStep, (maxCol - minCol + 1) * stepSec)
      } else if (active.kind === 'resize-end') {
        onNotesChangeRef.current(
          resizeNoteEnd(
            currentNotes,
            active.note,
            active.currentEndCol,
          ),
        )
      } else if (active.kind === 'resize-start') {
        onNotesChangeRef.current(
          resizeNoteStart(
            currentNotes,
            active.note,
            active.currentStartCol,
          ),
        )
      } else if (active.didMove) {
        const deltaCol = active.currentCol - active.anchorCol
        const deltaStep = active.anchorRowIndex - active.currentRowIndex
        onNotesChangeRef.current(
          moveNote(
            currentNotes,
            active.note,
            active.originStartCol + deltaCol,
            active.originScaleStep + deltaStep,
          ),
        )
      } else {
        onNotesChangeRef.current(removeNote(currentNotes, active.note))
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
  }, [drag, columnAtPointer, rowAtPointer, pointerMetrics, previewStep, endDrag])

  const frameStyle = useMemo(
    () => ({
      ['--melody-grid-column-count' as string]: layout.columnCount,
      ['--melody-grid-active-cols' as string]: activeCols,
    }),
    [layout.columnCount, activeCols],
  )

  return (
    <div className="melody-grid__scroll melody-grid__scroll--fluid">
      <div className="melody-grid__frame" style={frameStyle}>
        <MelodyGridBody
          notes={notes}
          rows={rows}
          layout={layout}
          activeCols={activeCols}
          disabled={disabled}
          noteFlashes={noteFlashes}
          drag={drag}
          hoveredScaleStep={hoveredScaleStep}
          gridRef={gridRef}
          setHoveredScaleStep={setHoveredScaleStep}
          onCellPointerDown={handleCellPointerDown}
          onCellKeyDown={handleCellKeyDown}
          onResizeEndPointerDown={handleResizeEndPointerDown}
          onResizeStartPointerDown={handleResizeStartPointerDown}
          onMovePointerDown={handleMovePointerDown}
          onBracePointerDown={handleBracePointerDown}
          onLoopColsChange={stableOnLoopColsChange}
        />
        {showPlayhead && playheadRatio !== null ? (
          <div className="melody-grid__playhead-layer" aria-hidden>
            <span
              className="melody-grid__playhead"
              style={{
                left: `${playheadRatio * 100}%`,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
