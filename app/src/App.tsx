import { useEffect, useRef, useState } from 'react'
import { GlobalEffectsToolbar } from './components/GlobalEffectsToolbar'
import { MasterSpectrum } from './components/MasterSpectrum'
import { StartAudioButton } from './components/StartAudioButton'
import { TapeLoopRow } from './components/TapeLoopRow'
import {
  createDemoTapeLoops,
  createMelody2Pattern,
  createTapeLoop,
  nextMelody2IdAndLabel,
  type DemoLoop,
} from './audio/demoPatterns'
import './components/MasterSpectrum.css'
import './components/TapeLoopRow.css'
import './App.css'

export default function App() {
  const [audioReady, setAudioReady] = useState(false)
  const [loops, setLoops] = useState<DemoLoop[] | null>(null)
  const [runningById, setRunningById] = useState<Record<string, boolean>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const loopsRef = useRef(loops)
  loopsRef.current = loops

  useEffect(() => {
    if (audioReady) {
      setLoops(createDemoTapeLoops())
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
    return () => {
      loopsRef.current?.forEach(({ loop }) => loop.dispose())
    }
  }, [])

  function setRunning(id: string, running: boolean) {
    setRunningById((prev) => ({ ...prev, [id]: running }))
  }

  function startAll() {
    if (!loops) {
      return
    }
    for (const { pattern, loop } of loops) {
      loop.start()
      setRunning(pattern.id, true)
    }
  }

  function stopAll() {
    if (!loops) {
      return
    }
    for (const { pattern, loop } of loops) {
      loop.stop()
      setRunning(pattern.id, false)
    }
  }

  function handleExpandedChange(id: string, expanded: boolean) {
    setExpandedId(expanded ? id : null)
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

  function handleAddLoop() {
    setLoops((prev) => {
      const existing = prev ?? []
      const { id, label } = nextMelody2IdAndLabel(existing)
      return [...existing, createTapeLoop(createMelody2Pattern(id, label))]
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
                disabled={!loops?.length}
                onClick={startAll}
              >
                play all
              </button>
              <button
                type="button"
                className="ensemble-btn ensemble-btn--stop"
                disabled={!loops?.length}
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
            onDelete={() => handleDeleteLoop(pattern.id)}
          />
        ))}

        {audioReady ? (
          <button
            type="button"
            className="loop-stack__add"
            aria-label="Add loop"
            onClick={handleAddLoop}
          >
            +
          </button>
        ) : null}
      </section>
    </div>
  )
}
