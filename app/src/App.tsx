import { useEffect, useMemo, useState } from 'react'
import { GlobalEffectsToolbar } from './components/GlobalEffectsToolbar'
import { MasterSpectrum } from './components/MasterSpectrum'
import { StartAudioButton } from './components/StartAudioButton'
import { TapeLoopRow } from './components/TapeLoopRow'
import { createDemoTapeLoops } from './audio/demoPatterns'
import './components/MasterSpectrum.css'
import './components/TapeLoopRow.css'
import './App.css'

export default function App() {
  const [audioReady, setAudioReady] = useState(false)
  const [runningById, setRunningById] = useState<Record<string, boolean>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const demoLoops = useMemo(() => {
    if (!audioReady) {
      return null
    }
    return createDemoTapeLoops()
  }, [audioReady])

  useEffect(() => {
    return () => {
      demoLoops?.forEach(({ loop }) => loop.dispose())
    }
  }, [demoLoops])

  function setRunning(id: string, running: boolean) {
    setRunningById((prev) => ({ ...prev, [id]: running }))
  }

  function startAll() {
    if (!demoLoops) {
      return
    }
    for (const { pattern, loop } of demoLoops) {
      loop.start()
      setRunning(pattern.id, true)
    }
  }

  function stopAll() {
    if (!demoLoops) {
      return
    }
    for (const { pattern, loop } of demoLoops) {
      loop.stop()
      setRunning(pattern.id, false)
    }
  }

  function handleExpandedChange(id: string, expanded: boolean) {
    setExpandedId(expanded ? id : null)
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
                disabled={!demoLoops}
                onClick={startAll}
              >
                play all
              </button>
              <button
                type="button"
                className="ensemble-btn ensemble-btn--stop"
                disabled={!demoLoops}
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
        {demoLoops?.map(({ pattern, loop }) => (
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
          />
        ))}
      </section>
    </div>
  )
}
