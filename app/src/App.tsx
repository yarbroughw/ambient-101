import { useEffect, useRef, useState } from 'react'
import { AddLoopControls } from './components/AddLoopControls'
import { GlobalEffectsToolbar } from './components/GlobalEffectsToolbar'
import { GlobalPaceControl } from './components/GlobalPaceControl'
import { GlobalTonalityToolbar } from './components/GlobalTonalityToolbar'
import { MasterSpectrum } from './components/MasterSpectrum'
import { SettingsButton } from './components/SettingsButton'
import { BackButton } from './components/BackButton'
import { StartupScreen } from './components/StartupScreen'
import { TapeLoopRow } from './components/TapeLoopRow'
import type { LoopPattern, PatternNote } from './audio/patternTypes'
import {
  applyPlaybackTiming,
  DEFAULT_PACE_SCALE,
  syncLoopPlayback,
  type PaceOptions,
} from './lib/globalPace'
import { clampOctaveShift, normalizeRoot } from './lib/scaleSteps'
import { loadPaceAffectsMelody, savePaceAffectsMelody } from './lib/paceSettings'
import {
  loadEnsemble,
  markEnsembleOpened,
  saveEnsemble,
} from './lib/ensembleStorage'
import {
  createBlankPattern,
  createTapeLoop,
  createTapeLoopsFromPatterns,
  duplicatePattern,
  importPattern,
  nextAvailableIdAndLabel,
  type DemoLoop,
} from './audio/demoPatterns'
import {
  createPatternFromPreset,
  LOOP_PRESETS,
} from './audio/loopPresets'
import type { ImportReelResult } from './components/ImportReelModal'
import { parseLoopPatternsJson } from './lib/loopStorage'
import './components/AddLoopControls.css'
import './components/GlobalPaceControl.css'
import './components/MasterSpectrum.css'
import './components/SettingsButton.css'
import './components/BackButton.css'
import './components/StartupScreen.css'
import './components/TapeLoopRow.css'
import './App.css'

export default function App() {
  const [audioReady, setAudioReady] = useState(false)
  const [activeEnsembleId, setActiveEnsembleId] = useState<string | null>(null)
  const [loops, setLoops] = useState<DemoLoop[] | null>(null)
  const [runningById, setRunningById] = useState<Record<string, boolean>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [paceScale, setPaceScale] = useState(DEFAULT_PACE_SCALE)
  const [paceAffectsMelody, setPaceAffectsMelody] = useState(loadPaceAffectsMelody)
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

  function paceOptions(): PaceOptions {
    return { paceScale, paceAffectsMelody }
  }

  function resyncAllLoops(
    entries: DemoLoop[] | null,
    options: PaceOptions = paceOptions(),
  ) {
    entries?.forEach((entry) => syncLoopPlayback(entry, entry.pattern, options))
  }

  function handlePaceScaleChange(nextScale: number) {
    const options = { paceScale: nextScale, paceAffectsMelody }
    setPaceScale(nextScale)
    setLoops((prev) => {
      if (prev) {
        resyncAllLoops(prev, options)
      }
      return prev
    })
  }

  function handlePaceAffectsMelodyChange(value: boolean) {
    setPaceAffectsMelody(value)
    savePaceAffectsMelody(value)
    setLoops((prev) => {
      if (prev) {
        resyncAllLoops(prev, { paceScale, paceAffectsMelody: value })
      }
      return prev
    })
  }

  function handleOpenEnsemble(ensembleId: string) {
    const loaded = loadEnsemble(ensembleId)
    const patterns = loaded?.loops ?? []
    const nextPaceScale = loaded?.paceScale ?? DEFAULT_PACE_SCALE
    setPaceScale(nextPaceScale)
    const entries = createTapeLoopsFromPatterns(patterns)
    resyncAllLoops(entries, {
      paceScale: nextPaceScale,
      paceAffectsMelody,
    })
    setLoops(entries)
    setActiveEnsembleId(ensembleId)
    markEnsembleOpened(ensembleId)
    setAudioReady(true)
  }

  function handleBackToStartup() {
    if (activeEnsembleId && loops) {
      saveEnsemble(activeEnsembleId, {
        loops: loops.map(({ pattern }) => pattern),
        paceScale,
      })
    }

    loops?.forEach(({ loop }) => {
      loop.stop()
      loop.dispose()
    })

    setLoops(null)
    setRunningById({})
    setExpandedId(null)
    setActiveEnsembleId(null)
    setPaceScale(DEFAULT_PACE_SCALE)
    setAudioReady(false)
  }

  useEffect(() => {
    if (!audioReady || !activeEnsembleId || loops === null) {
      return
    }

    saveEnsemble(activeEnsembleId, {
      loops: loops.map(({ pattern }) => pattern),
      paceScale,
    })
  }, [audioReady, activeEnsembleId, loops, paceScale])

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
      syncLoopPlayback(entry, entry.pattern, paceOptions())
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
      const entry = createTapeLoop(createBlankPattern(id, label))
      syncLoopPlayback(entry, entry.pattern, paceOptions())
      return [...existing, entry]
    })
  }

  function handleAddPresetLoop(presetId: string) {
    setLoops((prev) => {
      const existing = prev ?? []
      const preset = LOOP_PRESETS.find((entry) => entry.id === presetId)
      const baseLabel = preset?.label ?? presetId
      const { id, label } = nextAvailableIdAndLabel(baseLabel, existing)
      const entry = createTapeLoop(createPatternFromPreset(presetId, id, label))
      syncLoopPlayback(entry, entry.pattern, paceOptions())
      return [...existing, entry]
    })
  }

  function handleImportLoops(raw: string): ImportReelResult {
    let patterns: LoopPattern[]
    try {
      patterns = parseLoopPatternsJson(raw)
    } catch {
      return { ok: false, message: 'invalid JSON' }
    }

    if (patterns.length === 0) {
      return { ok: false, message: 'no valid reels found' }
    }

    setLoops((prev) => {
      const next = [...(prev ?? [])]
      for (const pattern of patterns) {
        const imported = importPattern(pattern, next)
        const entry = createTapeLoop(imported)
        syncLoopPlayback(entry, entry.pattern, paceOptions())
        next.push(entry)
      }
      return next
    })

    return { ok: true, count: patterns.length }
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
        syncLoopPlayback(entry, nextPattern, paceOptions())
        return { ...entry, pattern: nextPattern }
      })
    })
  }

  function handleNotesChange(id: string, notes: PatternNote[]) {
    updatePattern(id, { notes })
  }

  function handleRootChange(id: string, root: string) {
    updatePattern(id, { root: normalizeRoot(root) })
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

  function handleReverbChange(id: string, reverb: number) {
    const clamped = Math.min(1, Math.max(0, reverb))
    setLoops((prev) => {
      if (!prev) {
        return prev
      }

      return prev.map((entry) => {
        if (entry.pattern.id !== id) {
          return entry
        }

        entry.setReverb(clamped)
        return { ...entry, pattern: { ...entry.pattern, reverb: clamped } }
      })
    })
  }

  function handleDelayChange(id: string, delay: number) {
    const clamped = Math.min(1, Math.max(0, delay))
    setLoops((prev) => {
      if (!prev) {
        return prev
      }

      return prev.map((entry) => {
        if (entry.pattern.id !== id) {
          return entry
        }

        entry.setDelay(clamped)
        return { ...entry, pattern: { ...entry.pattern, delay: clamped } }
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
        syncLoopPlayback(entry, nextPattern, paceOptions())
        return { ...entry, pattern: nextPattern }
      })
    })
  }

  function handleBpmChange(id: string, bpm: number) {
    updatePattern(id, { bpm })
  }

  function handleInstrumentChange(id: string, instrument: string) {
    updatePattern(id, { instrument })
  }

  function handleGlobalRootChange(root: string) {
    const normalized = normalizeRoot(root)
    setLoops((prev) => {
      if (!prev) {
        return prev
      }

      return prev.map((entry) => {
        const nextPattern = { ...entry.pattern, root: normalized }
        syncLoopPlayback(entry, nextPattern, paceOptions())
        return { ...entry, pattern: nextPattern }
      })
    })
  }

  function handleGlobalScaleChange(scale: string) {
    setLoops((prev) => {
      if (!prev) {
        return prev
      }

      return prev.map((entry) => {
        const nextPattern = { ...entry.pattern, scale }
        syncLoopPlayback(entry, nextPattern, paceOptions())
        return { ...entry, pattern: nextPattern }
      })
    })
  }

  const reelRoots = loops?.map(({ pattern }) => pattern.root) ?? []
  const reelScaleTypes = loops?.map(({ pattern }) => pattern.scale) ?? []
  const composedPatterns = loops?.map(({ pattern }) => pattern) ?? []
  const pace = paceOptions()

  if (!audioReady) {
    return (
      <div className="app app--startup">
        <StartupScreen onOpen={handleOpenEnsemble} />
      </div>
    )
  }

  return (
    <div className="app">
      <BackButton onClick={handleBackToStartup} />
      <SettingsButton
        paceAffectsMelody={paceAffectsMelody}
        onPaceAffectsMelodyChange={handlePaceAffectsMelodyChange}
      />
      <div className="toolbar">
        <div className="toolbar__transport">
          <div className="toolbar__ensemble">
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
          </div>
          <GlobalPaceControl
            paceScale={paceScale}
            paceAffectsMelody={paceAffectsMelody}
            patterns={composedPatterns}
            disabled={!loops?.length}
            onPaceScaleChange={handlePaceScaleChange}
          />
        </div>
        <GlobalTonalityToolbar
          reelRoots={reelRoots}
          reelScaleTypes={reelScaleTypes}
          onGlobalRootChange={handleGlobalRootChange}
          onGlobalScaleChange={handleGlobalScaleChange}
        />
        <div className="toolbar__spectrum">
          <MasterSpectrum active />
        </div>
        <GlobalEffectsToolbar />
      </div>

      <section className="loop-stack" aria-label="Tape loops">
        {loops?.map(({ pattern, loop }) => {
          const playbackTiming = applyPlaybackTiming(pattern, pace)
          return (
          <TapeLoopRow
            key={pattern.id}
            pattern={pattern}
            paceOptions={pace}
            playbackLoopDuration={playbackTiming.loopDuration}
            playbackBpm={playbackTiming.bpm}
            loop={loop}
            running={runningById[pattern.id] ?? false}
            expanded={expandedId === pattern.id}
            onRunningChange={(running) => setRunning(pattern.id, running)}
            onExpandedChange={(expanded) =>
              handleExpandedChange(pattern.id, expanded)
            }
            onNotesChange={(notes) => handleNotesChange(pattern.id, notes)}
            onRootChange={(root) => handleRootChange(pattern.id, root)}
            onScaleChange={(scale) => handleScaleChange(pattern.id, scale)}
            onOctaveShiftChange={(shift) =>
              handleOctaveShiftChange(pattern.id, shift)
            }
            onBpmChange={(bpm) => handleBpmChange(pattern.id, bpm)}
            onLoopDurationChange={(duration) =>
              handleLoopDurationChange(pattern.id, duration)
            }
            onLabelChange={(label) => handleLabelChange(pattern.id, label)}
            onVolumeChange={(volume) =>
              handleVolumeChange(pattern.id, volume)
            }
            onReverbChange={(reverb) =>
              handleReverbChange(pattern.id, reverb)
            }
            onDelayChange={(delay) => handleDelayChange(pattern.id, delay)}
            onInstrumentChange={(instrument) =>
              handleInstrumentChange(pattern.id, instrument)
            }
            onDuplicate={() => handleDuplicateLoop(pattern.id)}
            onDelete={() => handleDeleteLoop(pattern.id)}
          />
          )
        })}

        <AddLoopControls
          onAddBlank={handleAddBlankLoop}
          onAddPreset={handleAddPresetLoop}
          onImport={handleImportLoops}
        />
      </section>
    </div>
  )
}
