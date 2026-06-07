import { useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { getMasterAnalyser } from '../audio/globalEffects'
import { drawMasterSpectrum } from '../lib/drawMasterSpectrum'
import './MasterSpectrum.css'

type MasterSpectrumProps = {
  active: boolean
}

export function MasterSpectrum({ active }: MasterSpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const smoothRef = useRef<number[]>([])

  useEffect(() => {
    if (!active) {
      return
    }

    let frameId = 0
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      smoothRef.current = []
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const tick = () => {
      const analyser = getMasterAnalyser()
      const values = analyser.getValue()
      const rect = canvas.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        drawMasterSpectrum(
          ctx,
          values,
          rect.width,
          rect.height,
          smoothRef.current,
          Tone.getContext().sampleRate,
        )
      }
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [active])

  return (
    <div className="master-spectrum" aria-hidden={!active}>
      <canvas ref={canvasRef} className="master-spectrum__canvas" />
    </div>
  )
}
