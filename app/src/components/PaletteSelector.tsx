import { useEffect, useState } from 'react'
import {
  applyPalette,
  PALETTE_OPTIONS,
  type PaletteId,
} from '../lib/palettes'
import { loadPaletteId, savePaletteId } from '../lib/paletteStorage'
import './PaletteSelector.css'

export function PaletteSelector() {
  const [paletteId, setPaletteId] = useState<PaletteId>(() => loadPaletteId())

  useEffect(() => {
    applyPalette(paletteId)
    savePaletteId(paletteId)
  }, [paletteId])

  const activePalette =
    PALETTE_OPTIONS.find((option) => option.id === paletteId) ??
    PALETTE_OPTIONS[0]

  return (
    <div className="palette-selector">
      <label className="palette-selector__control">
        <span className="palette-selector__label">palette</span>
        <select
          className="palette-selector__select"
          value={paletteId}
          title={activePalette.hint}
          onChange={(event) => setPaletteId(event.target.value as PaletteId)}
        >
          {PALETTE_OPTIONS.map((option) => (
            <option key={option.id} value={option.id} title={option.hint}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <span className="palette-selector__preview" aria-hidden>
        <span className="palette-selector__chip palette-selector__chip--canvas" />
        <span className="palette-selector__chip palette-selector__chip--loop" />
        <span className="palette-selector__chip palette-selector__chip--melody" />
        <span className="palette-selector__chip palette-selector__chip--active" />
      </span>
    </div>
  )
}
