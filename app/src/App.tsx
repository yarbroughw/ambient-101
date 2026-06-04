import { useEffect, useMemo, useState } from 'react'
import { StartAudioButton } from './components/StartAudioButton'
import { TapeLoopCard } from './components/TapeLoopCard'
import { createDemoTapeLoops } from './audio/demoPatterns'
import './components/TapeLoopCard.css'
import './App.css'

export default function App() {
  const [audioReady, setAudioReady] = useState(false)
  const [runningA, setRunningA] = useState(false)
  const [runningB, setRunningB] = useState(false)

  const loops = useMemo(() => {
    if (!audioReady) {
      return null
    }
    return createDemoTapeLoops()
  }, [audioReady])

  useEffect(() => {
    return () => {
      loops?.loopA.dispose()
      loops?.loopB.dispose()
    }
  }, [loops])

  function startAll() {
    if (!loops) {
      return
    }
    loops.loopA.start()
    loops.loopB.start()
    setRunningA(true)
    setRunningB(true)
  }

  function stopAll() {
    if (!loops) {
      return
    }
    loops.loopA.stop()
    loops.loopB.stop()
    setRunningA(false)
    setRunningB(false)
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
              disabled={!loops}
              onClick={startAll}
            >
              play all
            </button>
            <button
              type="button"
              className="ensemble-btn ensemble-btn--stop"
              disabled={!loops}
              onClick={stopAll}
            >
              stop all
            </button>
          </>
        )}
      </div>

      <section className="loop-grid" aria-label="Tape loops">
        {loops ? (
          <>
            <TapeLoopCard
              loop={loops.loopA}
              running={runningA}
              onRunningChange={setRunningA}
            />
            <TapeLoopCard
              loop={loops.loopB}
              running={runningB}
              onRunningChange={setRunningB}
            />
          </>
        ) : null}
      </section>
    </div>
  )
}
