import { useEffect, useRef, useState } from 'react'
import { AddLoopControls } from './components/AddLoopControls'
import { GlobalEffectsToolbar } from './components/GlobalEffectsToolbar'
import { MasterSpectrum } from './components/MasterSpectrum'
import { StartAudioButton } from './components/StartAudioButton'
import { TapeLoopRow } from './components/TapeLoopRow'
import type { LoopPattern, PatternNote } from './audio/patternTypes'
import { clampOctaveShift } from './lib/scaleSteps'
import {
  createBlankPattern,
  createPresetPattern,
  createTapeLoop,
  createTapeLoopsFromPatterns,
  duplicatePattern,
  LOOP_PRESETS,
  nextAvailableIdAndLabel,
  type DemoLoop,
  type LoopPresetId,
} from './audio/demoPatterns'
import { loadLoopPatterns, saveLoopPatterns } from './lib/loopStorage'
import './components/AddLoopControls.css'
import './components/MasterSpectrum.css'
import './components/TapeLoopRow.css'
import './App.css'

export default function App() {
  const [audioReady, setAudioReady] = useState(false)
  const [loops, setLoops] = useState<DemoLoop[] | null>(null)
  const [runningById, setRunningById] = useState<Record<string, boolean>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const loopsRef = useRef(loops)
  const runningByIdRef = useRef(runningById)
  const audioReadyRef = useRef(audioReady)
  loopsRef.current = loops
  runningByIdRef.current = runningById
  audioReadyRef.current = audioReady

  const loopIds = loops?.map(({ pattern }) => pattern.id) ?? []
  const runningCount = loopIds.filter((id) => runningById[id]).length
  const allPlaying = loopIds.length > 0 && runningCount === loopIds.length
  const allStopped = runningCount === 0

  useEffect(() => {
    if (audioReady) {
      setLoops(createTapeLoopsFromPatterns(loadLoopPatterns()))
      return
    }

    setLoops((prev) => {
      prev?.forEach(({ loop }) => loop.dispose())
      return null
    })
    setRunningById({})
    setExpandedId(null)
  }, [audioReady])

  useEffect(() => {
    if (!audioReady || loops === null) {
      return
    }

    saveLoopPatterns(loops.map(({ pattern }) => pattern))
  }, [audioReady, loops])

  useEffect(() => {
    return () => {
      loopsRef.current?.forEach(({ loop }) => loop.dispose())
    }
  }, [])

  useEffect(() => {
    function shouldIgnoreSpace(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) {
        return false
      }

      if (target.closest('input, textarea, select, [contenteditable="true"]')) {
        return true
      }

      return target.closest('.melody-grid__cell') != null
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== 'Space' || event.repeat) {
        return
      }

      if (!audioReadyRef.current || shouldIgnoreSpace(event.target)) {
        return
      }

      const currentLoops = loopsRef.current
      if (!currentLoops?.length) {
        return
      }

      const running = runningByIdRef.current
      const anyPlaying = currentLoops.some(({ pattern }) => running[pattern.id])

      event.preventDefault()

      if (anyPlaying) {
        for (const { loop } of currentLoops) {
          loop.stop()
        }
        setRunningById({})
        return
      }

      const nextRunning: Record<string, boolean> = {}
      for (const { pattern, loop } of currentLoops) {
        loop.start()
        nextRunning[pattern.id] = true
      }
      setRunningById(nextRunning)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function setRunning(id: string, running: boolean) {
    setRunningById((prev) => ({ ...prev, [id]: running }))
  }

  function startAll() {
    if (!loops) {
      return
    }

    const nextRunning: Record<string, boolean> = { ...runningById }
    for (const { pattern, loop } of loops) {
      loop.start()
      nextRunning[pattern.id] = true
    }
    setRunningById(nextRunning)
  }

  function stopAll() {
    if (!loops) {
      return
    }

    for (const { loop } of loops) {
      loop.stop()
    }
    setRunningById({})
  }

  function handleExpandedChange(id: string, expanded: boolean) {
    setExpandedId(expanded ? id : null)
  }

  function handleDuplicateLoop(id: string) {
    setLoops((prev) => {
      if (!prev) {
        return prev
      }

      const index = prev.findIndex((entry) => entry.pattern.id === id)
      if (index === -1) {
        return prev
      }

      const duplicate = duplicatePattern(prev[index].pattern, prev)
      const entry = createTapeLoop(duplicate)
      const next = [...prev]
      next.splice(index + 1, 0, entry)
      return next
    })
  }

  function handleDeleteLoop(id: string) {
    setLoops((prev) => {
      if (!prev) {
        return prev
      }

      const target = prev.find((entry) => entry.pattern.id === id)
      if (!target) {
        return prev
      }

      target.loop.stop()
      target.loop.dispose()
      return prev.filter((entry) => entry.pattern.id !== id)
    })

    setRunningById((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })

    setExpandedId((prev) => (prev === id ? null : prev))
  }

  function handleAddBlankLoop() {
    setLoops((prev) => {
      const existing = prev ?? []
      const { id, label } = nextAvailableIdAndLabel('loop', existing)
      return [...existing, createTapeLoop(createBlankPattern(id, label))]
    })
  }

  function handleAddPresetLoop(presetId: LoopPresetId) {
    setLoops((prev) => {
      const existing = prev ?? []
      const preset = LOOP_PRESETS.find((entry) => entry.id === presetId)
      const baseLabel = preset?.label ?? presetId
      const { id, label } = nextAvailableIdAndLabel(baseLabel, existing)
      return [...existing, createTapeLoop(createPresetPattern(presetId, id, label))]
    })
  }

  function updatePattern(id: string, patch: Partial<LoopPattern>) {
    setLoops((prev) => {
      if (!prev) {
        return prev
      }

      return prev.map((entry) => {
        if (entry.pattern.id !== id) {
          return entry
        }

        const nextPattern = { ...entry.pattern, ...patch }
        entry.rebindPattern(nextPattern)
        return { ...entry, pattern: nextPattern }
      })
    })
  }

  function handleNotesChange(id: string, notes: PatternNote[]) {
    updatePattern(id, { notes })
  }

  function handleScaleChange(id: string, scale: string) {
    updatePattern(id, { scale })
  }

  function handleOctaveShiftChange(id: string, octaveShift: number) {
    updatePattern(id, { octaveShift: clampOctaveShift(octaveShift) })
  }

  function handleLabelChange(id: string, label: string) {
    updatePattern(id, { label })
  }

  function handleVolumeChange(id: string, volume: number) {
    const clamped = Math.min(1, Math.max(0, volume))
    setLoops((prev) => {
      if (!prev) {
        return prev
      }

      return prev.map((entry) => {
        if (entry.pattern.id !== id) {
          return entry
        }

        entry.setVolume(clamped)
        return { ...entry, pattern: { ...entry.pattern, volume: clamped } }
      })
    })
  }

  function handleLoopDurationChange(id: string, duration: number) {
    setLoops((prev) => {
      if (!prev) {
        return prev
      }

      return prev.map((entry) => {
        if (entry.pattern.id !== id) {
          return entry
        }

        const nextPattern = { ...entry.pattern, loopDuration: duration }
        entry.loop.setDuration(duration)
        return { ...entry, pattern: nextPattern }
      })
    })
  }

  return (
    <div className="app">
      <div className="toolbar">
        <div className="toolbar__left">
          {!audioReady ? (
            <StartAudioButton onReady={() => setAudioReady(true)} />
          ) : (
            <>
              <button
                type="button"
                className="ensemble-btn ensemble-btn--play"
                disabled={!loops?.length || allPlaying}
                onClick={startAll}
              >
                play all
              </button>
              <button
                type="button"
                className="ensemble-btn ensemble-btn--stop"
                disabled={!loops?.length || allStopped}
                onClick={stopAll}
              >
                stop all
              </button>
            </>
          )}
        </div>
        <div className="toolbar__spectrum">
          <MasterSpectrum active={audioReady} />
        </div>
        <GlobalEffectsToolbar disabled={!audioReady} />
      </div>

      <section className="loop-stack" aria-label="Tape loops">
        {loops?.map(({ pattern, loop }) => (
          <TapeLoopRow
            key={pattern.id}
            pattern={pattern}
            loop={loop}
            running={runningById[pattern.id] ?? false}
            expanded={expandedId === pattern.id}
            onRunningChange={(running) => setRunning(pattern.id, running)}
            onExpandedChange={(expanded) =>
              handleExpandedChange(pattern.id, expanded)
            }
            onNotesChange={(notes) => handleNotesChange(pattern.id, notes)}
            onScaleChange={(scale) => handleScaleChange(pattern.id, scale)}
            onOctaveShiftChange={(shift) =>
              handleOctaveShiftChange(pattern.id, shift)
            }
            onLoopDurationChange={(duration) =>
              handleLoopDurationChange(pattern.id, duration)
            }
            onLabelChange={(label) => handleLabelChange(pattern.id, label)}
            onVolumeChange={(volume) =>
              handleVolumeChange(pattern.id, volume)
            }
            onDuplicate={() => handleDuplicateLoop(pattern.id)}
            onDelete={() => handleDeleteLoop(pattern.id)}
          />
        ))}

        {audioReady ? (
          <AddLoopControls
            onAddBlank={handleAddBlankLoop}
            onAddPreset={handleAddPresetLoop}
          />
        ) : null}
      </section>
    </div>
  )
}
