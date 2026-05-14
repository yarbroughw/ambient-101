import { Scale } from 'tonal'
import './App.css'

const scaleSmoke = Scale.get('C major').notes.join(' · ')

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Ambient 101</h1>
        <p className="tagline">Workshop web app — scaffold</p>
      </header>
      <p className="muted" aria-label="Tonal dependency check">
        Scale.get(&quot;C major&quot;): {scaleSmoke}
      </p>
    </div>
  )
}
