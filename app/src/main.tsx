import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initPaletteFromStorage } from './lib/paletteStorage'
import './index.css'
import App from './App.tsx'

initPaletteFromStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
