import { useEffect, useRef, useState } from 'react'
import { AddLoopControls } from './components/AddLoopControls'
import { GlobalEffectsToolbar } from './components/GlobalEffectsToolbar'
import { GlobalPaceControl } from './components/GlobalPaceControl'
import { GlobalTonalityToolbar } from './components/GlobalTonalityToolbar'
import { MasterSpectrum } from './components/MasterSpectrum'
import { SettingsButton } from './components/SettingsButton'
import { ViewToggle } from './components/ViewToggleButton'
import './components/ViewToggleButton.css'
import { BackButton } from './components/BackButton'
import { StartupScreen } from './components/StartupScreen'
import { TapeLoopRow } from './components/TapeLoopRow'
import { EnsembleTimeline } from './components/EnsembleTimeline'
import type { LoopPattern, PatternNote } from './audio/patternTypes'
import {
  audioNowSec,
  ensureAudioStarted,
  installAudioSessionRecovery,
} from './audio/audioSession'
import {
  applyPlaybackTiming,
  adaptPatternForLockMelodyTempoChange,
  DEFAULT_PACE_SCALE,
  syncLoopPlayback,
  type PaceOptions,
} from './lib/globalPace'
import { clampLoopCols } from './lib/gridLayout'
import {
  clampOctaveShift,
  DEFAULT_ROOT,
  DEFAULT_SCALE_TYPE,
  globalSelectValue,
  MIXED_VALUE,
  normalizeRoot,
  representativeValue,
} from './lib/scaleSteps'
import { loadLockMelodyTempo, saveLockMelodyTempo } from './lib/paceSettings'
import {
  loadTimelineMotion,
  loadTimelineZoomStop,
  saveTimelineMotion,
  saveTimelineZoomStop,
  type TimelineMotion,
} from './lib/motionSettings'
import { TimelineMotionControls } from './components/TimelineMotionControls'
import './components/TimelineMotionControls.css'
import {
  getEnsembleEntry,
  loadEnsemble,
  markEnsembleOpened,
  renameEnsemble,
  saveEnsemble,
} from './lib/ensembleStorage'
import { EnsembleTitle } from './components/EnsembleTitle'
import { EnsembleSyncLabel } from './components/EnsembleSyncLabel'
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
import { DEFAULT_START_LEAD_SEC } from './audio/tapeLoop'
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

// Shared downbeat scheduled slightly ahead so per-loop setup cost can't
// stagger the reels' actual starts. Reuses the same lead the single-loop
// start path applies, so the two can't drift.
const START_ALL_LEAD_SEC = DEFAULT_START_LEAD_SEC

export default function App() {
  const [audioReady, setAudioReady] = useState(false)
  const [activeEnsembleId, setActiveEnsembleId] = useState<string | null>(null)
  const [ensembleName, setEnsembleName] = useState('')
  const [loops, setLoops] = useState<DemoLoop[] | null>(null)
  const [runningById, setRunningById] = useState<Record<string, boolean>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'stack' | 'timeline'>('stack')
  const [paceScale, setPaceScale] = useState(DEFAULT_PACE_SCALE)
  // Whether the underlying AudioContext is actually running. The browser can
  // suspend it behind our back (long idle, device sleep); when that happens
  // while loops are "playing" we surface a resume affordance instead of a
  // frozen playhead.
  const [audioContextRunning, setAudioContextRunning] = useState(true)
  const [lockMelodyTempo, setLockMelodyTempo] = useState(loadLockMelodyTempo)
  const [timelineMotion, setTimelineMotion] = useState(loadTimelineMotion)
  const [timelineZoomStop, setTimelineZoomStop] = useState(loadTimelineZoomStop)
  // Last value the global tonality controls represented, shown (with a trailing
  // asterisk) when reels disagree so the dropdowns never blank out to just "*".
  const [lastGlobalRoot, setLastGlobalRoot] = useState(DEFAULT_ROOT as string)
  const [lastGlobalScale, setLastGlobalScale] = useState(
    DEFAULT_SCALE_TYPE as string,
  )
  const loopsRef = useRef(loops)
  const runningByIdRef = useRef(runningById)
  const audioReadyRef = useRef(audioReady)
  useEffect(() => {
    loopsRef.current = loops
    runningByIdRef.current = runningById
    audioReadyRef.current = audioReady
  })

  const loopIds = loops?.map(({ pattern }) => pattern.id) ?? []
  const runningCount = loopIds.filter((id) => runningById[id]).length
  const allPlaying = loopIds.length > 0 && runningCount === loopIds.length
  const allStopped = runningCount === 0

  function paceOptions(): PaceOptions {
    return { paceScale, lockMelodyTempo }
  }

  function resyncAllLoops(
    entries: DemoLoop[] | null,
    options: PaceOptions = paceOptions(),
  ) {
    entries?.forEach((entry) => syncLoopPlayback(entry, entry.pattern, options))
  }

  function handlePaceScaleChange(nextScale: number) {
    const options = { paceScale: nextScale, lockMelodyTempo }
    setPaceScale(nextScale)
    resyncAllLoops(loopsRef.current, options)
  }

  function handleLockMelodyTempoChange(value: boolean) {
    const previous = lockMelodyTempo
    setLockMelodyTempo(value)
    saveLockMelodyTempo(value)

    const options = { paceScale, lockMelodyTempo: value }
    const entries = loopsRef.current
    if (!entries) {
      return
    }

    const updated = entries.map((entry) => {
      const nextPattern = adaptPatternForLockMelodyTempoChange(
        entry.pattern,
        options,
        previous,
      )
      syncLoopPlayback(entry, nextPattern, options)
      return { ...entry, pattern: nextPattern }
    })
    setLoops(updated)
  }

  function handleTimelineMotionChange(value: TimelineMotion) {
    setTimelineMotion(value)
    saveTimelineMotion(value)
  }

  function handleTimelineZoomStopChange(value: number) {
    setTimelineZoomStop(value)
    saveTimelineZoomStop(value)
  }

  function handleOpenEnsemble(ensembleId: string) {
    const loaded = loadEnsemble(ensembleId)
    const patterns = loaded?.loops ?? []
    const nextPaceScale = loaded?.paceScale ?? DEFAULT_PACE_SCALE
    setPaceScale(nextPaceScale)
    const entries = createTapeLoopsFromPatterns(patterns)
    resyncAllLoops(entries, {
      paceScale: nextPaceScale,
      lockMelodyTempo,
    })
    setLastGlobalRoot(
      representativeValue(
        patterns.map((pattern) => pattern.root),
        DEFAULT_ROOT,
      ),
    )
    setLastGlobalScale(
      representativeValue(
        patterns.map((pattern) => pattern.scale),
        DEFAULT_SCALE_TYPE,
      ),
    )
    setLoops(entries)
    setActiveEnsembleId(ensembleId)
    setEnsembleName(getEnsembleEntry(ensembleId)?.name ?? '')
    markEnsembleOpened(ensembleId)
    setAudioReady(true)
  }

  function handleEnsembleRename(name: string) {
    if (!activeEnsembleId) {
      return
    }
    renameEnsemble(activeEnsembleId, name)
    setEnsembleName(getEnsembleEntry(activeEnsembleId)?.name ?? name)
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
    setViewMode('stack')
    setActiveEnsembleId(null)
    setEnsembleName('')
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
    const recovery = installAudioSessionRecovery(setAudioContextRunning)
    return () => recovery.dispose()
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

      void ensureAudioStarted().then(() => {
        const startAtSec = audioNowSec() + START_ALL_LEAD_SEC
        const nextRunning: Record<string, boolean> = {}
        for (const { pattern, loop } of currentLoops) {
          loop.start(startAtSec)
          nextRunning[pattern.id] = true
        }
        setRunningById(nextRunning)
      })
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) {
        return false
      }
      return (
        target.closest('input, textarea, select, [contenteditable="true"]') != null
      )
    }

    function onKeyDown(event: KeyboardEvent) {
      // Lowercase "t" only — Shift+T yields "T" and is ignored, as are combos.
      if (event.key !== 't' || event.repeat) {
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      if (!audioReadyRef.current || isTypingTarget(event.target)) {
        return
      }
      if (!loopsRef.current?.length) {
        return
      }

      event.preventDefault()
      setViewMode((mode) => (mode === 'stack' ? 'timeline' : 'stack'))
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleSelectLane(id: string) {
    setViewMode('stack')
    // Double rAF: wait for the stack view to commit and paint before scrolling.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document
          .getElementById(`reel-${id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    })
  }

  function setRunning(id: string, running: boolean) {
    setRunningById((prev) => ({ ...prev, [id]: running }))
  }

  async function startAll() {
    if (!loops) {
      return
    }

    await ensureAudioStarted()

    const startAtSec = audioNowSec() + START_ALL_LEAD_SEC
    const nextRunning: Record<string, boolean> = { ...runningById }
    for (const { pattern, loop } of loops) {
      loop.start(startAtSec)
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
    const current = loopsRef.current
    if (!current) {
      return
    }
    const index = current.findIndex((entry) => entry.pattern.id === id)
    if (index === -1) {
      return
    }
    const duplicate = duplicatePattern(current[index].pattern, current)
    const entry = createTapeLoop(duplicate)
    syncLoopPlayback(entry, entry.pattern, paceOptions())
    setLoops((prev) => {
      if (!prev) {
        return prev
      }
      const next = [...prev]
      next.splice(index + 1, 0, entry)
      return next
    })
  }

  function handleDeleteLoop(id: string) {
    const target = loopsRef.current?.find((entry) => entry.pattern.id === id)
    if (target) {
      target.loop.stop()
      target.loop.dispose()
    }
    setLoops((prev) => prev?.filter((entry) => entry.pattern.id !== id) ?? prev)
    setRunningById((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setExpandedId((prev) => (prev === id ? null : prev))
  }

  function handleAddBlankLoop() {
    const existing = loopsRef.current ?? []
    const { id, label } = nextAvailableIdAndLabel('loop', existing)
    const reelRoots = existing.map(({ pattern }) => pattern.root)
    const reelScaleTypes = existing.map(({ pattern }) => pattern.scale)
    const rootConsensus = globalSelectValue(reelRoots, lastGlobalRoot)
    const scaleConsensus = globalSelectValue(reelScaleTypes, lastGlobalScale)
    const root = rootConsensus === MIXED_VALUE ? lastGlobalRoot : rootConsensus
    const scale = scaleConsensus === MIXED_VALUE ? lastGlobalScale : scaleConsensus
    const entry = createTapeLoop(createBlankPattern(id, label, { root, scale }))
    syncLoopPlayback(entry, entry.pattern, paceOptions())
    setLoops((prev) => [...(prev ?? []), entry])
  }

  function handleAddPresetLoop(presetId: string) {
    const existing = loopsRef.current ?? []
    const preset = LOOP_PRESETS.find((entry) => entry.id === presetId)
    const baseLabel = preset?.label ?? presetId
    const { id, label } = nextAvailableIdAndLabel(baseLabel, existing)
    const entry = createTapeLoop(createPatternFromPreset(presetId, id, label))
    syncLoopPlayback(entry, entry.pattern, paceOptions())
    setLoops((prev) => [...(prev ?? []), entry])
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

    const existing = loopsRef.current ?? []
    const newEntries: DemoLoop[] = []
    const combined = [...existing]
    const pace = paceOptions()
    for (const pattern of patterns) {
      const imported = importPattern(pattern, combined)
      const entry = createTapeLoop(imported)
      syncLoopPlayback(entry, imported, pace)
      combined.push(entry)
      newEntries.push(entry)
    }
    setLoops((prev) => [...(prev ?? []), ...newEntries])

    return { ok: true, count: patterns.length }
  }

  function updatePattern(id: string, patch: Partial<LoopPattern>) {
    const entry = loopsRef.current?.find((e) => e.pattern.id === id)
    if (!entry) {
      return
    }
    const nextPattern = { ...entry.pattern, ...patch }
    syncLoopPlayback(entry, nextPattern, paceOptions())
    setLoops((prev) =>
      prev?.map((e) => (e.pattern.id === id ? { ...e, pattern: nextPattern } : e)) ?? prev,
    )
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

  function handleAudioEffectChange(
    id: string,
    effect: 'volume' | 'reverb' | 'delay',
    value: number,
  ) {
    const clamped = Math.min(1, Math.max(0, value))
    const entry = loopsRef.current?.find((e) => e.pattern.id === id)
    if (!entry) {
      return
    }
    if (effect === 'volume') entry.setVolume(clamped)
    else if (effect === 'reverb') entry.setReverb(clamped)
    else entry.setDelay(clamped)
    setLoops((prev) =>
      prev?.map((e) =>
        e.pattern.id === id
          ? { ...e, pattern: { ...e.pattern, [effect]: clamped } }
          : e,
      ) ?? prev,
    )
  }

  function handleLoopTimingChange(id: string, loopDurationMs: number, bpm: number) {
    const entry = loopsRef.current?.find((e) => e.pattern.id === id)
    if (!entry) {
      return
    }
    const nextPattern = { ...entry.pattern, loopDurationMs, bpm }
    syncLoopPlayback(entry, nextPattern, paceOptions())
    setLoops((prev) =>
      prev?.map((e) => (e.pattern.id === id ? { ...e, pattern: nextPattern } : e)) ?? prev,
    )
  }

  function handleBpmChange(id: string, bpm: number) {
    updatePattern(id, { bpm })
  }

  function handleLoopColsChange(id: string, loopCols: number) {
    const entry = loopsRef.current?.find((e) => e.pattern.id === id)
    if (!entry) {
      return
    }
    const clampedCols = clampLoopCols(loopCols)
    if (clampedCols === entry.pattern.loopCols) {
      return
    }
    // Scale the tape period with the window so the current fill (and a
    // seamless loop especially) is preserved as the loop is shortened.
    const ratio = clampedCols / entry.pattern.loopCols
    const nextDurationMs = Math.round(entry.pattern.loopDurationMs * ratio)
    const nextPattern = {
      ...entry.pattern,
      loopCols: clampedCols,
      loopDurationMs: nextDurationMs,
    }
    syncLoopPlayback(entry, nextPattern, paceOptions())
    setLoops((prev) =>
      prev?.map((e) => (e.pattern.id === id ? { ...e, pattern: nextPattern } : e)) ?? prev,
    )
  }

  function handleInstrumentChange(id: string, instrument: string) {
    // Cutoff, resonance and the A/R envelope are relative to each instrument's
    // natural voice, so clear them; the rebuilt voice falls back to the new
    // instrument's recipe defaults. Chorus is instrument-agnostic and persists.
    updatePattern(id, {
      instrument,
      cutoff: undefined,
      resonance: undefined,
      attack: undefined,
      release: undefined,
    })
  }

  function handleVoiceParamChange(
    id: string,
    param: 'cutoff' | 'resonance' | 'chorus' | 'gain' | 'attack' | 'release',
    value: number,
  ) {
    const entry = loopsRef.current?.find((e) => e.pattern.id === id)
    if (!entry) {
      return
    }
    const clamp = (lo: number, hi: number) => Math.min(hi, Math.max(lo, value))
    const next =
      param === 'cutoff'
        ? clamp(20, 20000)
        : param === 'resonance'
          ? clamp(0, 30)
          : param === 'chorus' || param === 'gain'
            ? clamp(0, 1)
            : clamp(0, 10) // attack / release, in seconds

    // Live voice update only — these are timbral params, no note recompile.
    if (param === 'cutoff') entry.setCutoff(next)
    else if (param === 'resonance') entry.setResonance(next)
    else if (param === 'chorus') entry.setChorus(next)
    else if (param === 'gain') entry.setGain(next)
    else {
      const attack = param === 'attack' ? next : entry.pattern.attack
      const release = param === 'release' ? next : entry.pattern.release
      entry.setEnvelope(attack, release)
    }

    setLoops((prev) =>
      prev?.map((e) =>
        e.pattern.id === id
          ? { ...e, pattern: { ...e.pattern, [param]: next } }
          : e,
      ) ?? prev,
    )
  }

  function handleGlobalRootChange(root: string) {
    const normalized = normalizeRoot(root)
    setLastGlobalRoot(normalized)
    const current = loopsRef.current
    if (!current) {
      return
    }
    const pace = paceOptions()
    const nextLoops = current.map((entry) => {
      const nextPattern = { ...entry.pattern, root: normalized }
      syncLoopPlayback(entry, nextPattern, pace)
      return { ...entry, pattern: nextPattern }
    })
    setLoops(nextLoops)
  }

  function handleGlobalScaleChange(scale: string) {
    setLastGlobalScale(scale)
    const current = loopsRef.current
    if (!current) {
      return
    }
    const pace = paceOptions()
    const nextLoops = current.map((entry) => {
      const nextPattern = { ...entry.pattern, scale }
      syncLoopPlayback(entry, nextPattern, pace)
      return { ...entry, pattern: nextPattern }
    })
    setLoops(nextLoops)
  }

  const reelRoots = loops?.map(({ pattern }) => pattern.root) ?? []
  const reelScaleTypes = loops?.map(({ pattern }) => pattern.scale) ?? []
  const composedPatterns = loops?.map(({ pattern }) => pattern) ?? []
  const pace = paceOptions()

  const rootConsensus = globalSelectValue(reelRoots, lastGlobalRoot)
  const scaleConsensus = globalSelectValue(reelScaleTypes, lastGlobalScale)
  const rootMixed = rootConsensus === MIXED_VALUE
  const scaleMixed = scaleConsensus === MIXED_VALUE
  const globalRootValue = rootMixed ? lastGlobalRoot : rootConsensus
  const globalScaleValue = scaleMixed ? lastGlobalScale : scaleConsensus

  const hasLoops = (loops?.length ?? 0) > 0
  const showTimeline = viewMode === 'timeline' && hasLoops

  if (!audioReady) {
    return (
      <div className="app app--startup">
        <SettingsButton
          lockMelodyTempo={lockMelodyTempo}
          onLockMelodyTempoChange={handleLockMelodyTempoChange}
        />
        <StartupScreen onOpen={handleOpenEnsemble} />
      </div>
    )
  }

  return (
    <div className="app">
      <BackButton onClick={handleBackToStartup} />
      <EnsembleTitle name={ensembleName} onRename={handleEnsembleRename} />
      <SettingsButton
        lockMelodyTempo={lockMelodyTempo}
        onLockMelodyTempoChange={handleLockMelodyTempoChange}
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
            lockMelodyTempo={lockMelodyTempo}
            patterns={composedPatterns}
            disabled={!loops?.length}
            onPaceScaleChange={handlePaceScaleChange}
          />
        </div>
        <GlobalTonalityToolbar
          disabled={!loops?.length}
          rootValue={globalRootValue}
          rootMixed={rootMixed}
          scaleValue={globalScaleValue}
          scaleMixed={scaleMixed}
          onGlobalRootChange={handleGlobalRootChange}
          onGlobalScaleChange={handleGlobalScaleChange}
        />
        <div className="toolbar__spectrum">
          <MasterSpectrum active />
        </div>
        <GlobalEffectsToolbar />
      </div>

      {!audioContextRunning && runningCount > 0 ? (
        <button
          type="button"
          className="audio-paused-banner"
          onClick={() => void ensureAudioStarted()}
        >
          audio paused by the browser — click to resume
        </button>
      ) : null}

      <div
        className={`view-toggle-row${
          showTimeline ? ' view-toggle-row--timeline' : ''
        }`}
      >
        <EnsembleSyncLabel
          loops={loops ?? []}
          pace={pace}
          runningById={runningById}
        />
        {showTimeline ? (
          <TimelineMotionControls
            motion={timelineMotion}
            zoomStop={timelineZoomStop}
            onMotionChange={handleTimelineMotionChange}
            onZoomStopChange={handleTimelineZoomStopChange}
          />
        ) : null}
        <ViewToggle
          mode={showTimeline ? 'timeline' : 'stack'}
          disabled={!hasLoops}
          onModeChange={setViewMode}
        />
      </div>

      {showTimeline ? (
        <EnsembleTimeline
          loops={loops ?? []}
          runningById={runningById}
          motion={timelineMotion}
          zoomStop={timelineZoomStop}
          onSelectLane={handleSelectLane}
        />
      ) : (
      <section className="loop-stack" aria-label="Tape loops">
        {loops?.map(({ pattern, loop }) => {
          const playbackTiming = applyPlaybackTiming(pattern, pace)
          return (
          <TapeLoopRow
            key={pattern.id}
            pattern={pattern}
            paceOptions={pace}
            playbackLoopDuration={playbackTiming.loopDurationSec}
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
            onLoopTimingChange={(loopDurationMs, bpm) =>
              handleLoopTimingChange(pattern.id, loopDurationMs, bpm)
            }
            onLabelChange={(label) => handleLabelChange(pattern.id, label)}
            onVolumeChange={(volume) =>
              handleAudioEffectChange(pattern.id, 'volume', volume)
            }
            onReverbChange={(reverb) =>
              handleAudioEffectChange(pattern.id, 'reverb', reverb)
            }
            onDelayChange={(delay) =>
              handleAudioEffectChange(pattern.id, 'delay', delay)
            }
            onInstrumentChange={(instrument) =>
              handleInstrumentChange(pattern.id, instrument)
            }
            onCutoffChange={(hz) =>
              handleVoiceParamChange(pattern.id, 'cutoff', hz)
            }
            onResonanceChange={(q) =>
              handleVoiceParamChange(pattern.id, 'resonance', q)
            }
            onChorusChange={(amount) =>
              handleVoiceParamChange(pattern.id, 'chorus', amount)
            }
            onGainChange={(amount) =>
              handleVoiceParamChange(pattern.id, 'gain', amount)
            }
            onAttackChange={(attack) =>
              handleVoiceParamChange(pattern.id, 'attack', attack)
            }
            onReleaseChange={(release) =>
              handleVoiceParamChange(pattern.id, 'release', release)
            }
            onLoopColsChange={(cols) => handleLoopColsChange(pattern.id, cols)}
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
      )}
    </div>
  )
}
