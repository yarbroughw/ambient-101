import { useEffect, useMemo, useState } from 'react'
import { StartAudioButton } from './components/StartAudioButton'
import { TapeLoopCard } from './components/TapeLoopCard'
import { createDemoTapeLoops } from './audio/demoPatterns'
import './components/TapeLoopCard.css'
import './App.css'

export default function App() {
  const [audioReady, setAudioReady] = useState(false)
  const [runningById, setRunningById] = useState<Record<string, boolean>>({})

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

  return (
    <div className="app">
      <div className="toolbar">
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

      <section className="loop-grid" aria-label="Tape loops">
        {demoLoops?.map(({ pattern, loop }) => (
          <TapeLoopCard
            key={pattern.id}
            loop={loop}
            running={runningById[pattern.id] ?? false}
            onRunningChange={(running) => setRunning(pattern.id, running)}
          />
        ))}
      </section>
    </div>
  )
}
