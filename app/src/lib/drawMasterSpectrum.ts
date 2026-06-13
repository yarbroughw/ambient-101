import { readCssColorString, rgbaFromCssVar } from './themeColors'

const MIN_FREQ = 40
const MAX_FREQ = 12000
const FLOOR_DB = -90
const TILT_DB_PER_OCTAVE = 3.5
const TILT_PIVOT_FREQ = 1000
// Adaptive ceiling: individual FFT bins rarely exceed -50 dBFS even at full output,
// so a fixed 0 dB ceiling wastes most of the canvas. Track the recent peak instead.
const CEILING_HEADROOM_DB = 6
const CEILING_MIN_DB = -50
const CEILING_MAX_DB = 0
const CEILING_DECAY_DB_PER_FRAME = 0.05

let adaptiveCeilingDb = CEILING_MIN_DB

// Two box-blur passes approximate a gaussian — rounds off bin-level jitter at the
// low end and gives narrow partials a soft skirt, like Ableton's ~1/12-octave smoothing
function spatialSmooth(values: Float64Array, radius: number, passes: number): void {
  const n = values.length
  if (n < 2 || radius < 1) {
    return
  }
  const scratch = new Float64Array(n)
  for (let pass = 0; pass < passes; pass++) {
    for (let i = 0; i < n; i++) {
      let sum = 0
      let count = 0
      const start = Math.max(0, i - radius)
      const end = Math.min(n - 1, i + radius)
      for (let j = start; j <= end; j++) {
        sum += values[j]
        count++
      }
      scratch[i] = sum / count
    }
    values.set(scratch)
  }
}

function resolveFrequencyBins(
  frequencyData: Float32Array | Float32Array[],
): Float32Array | null {
  if (frequencyData instanceof Float32Array) {
    return frequencyData.length > 0 ? frequencyData : null
  }

  const firstChannel = frequencyData[0]
  if (firstChannel instanceof Float32Array && firstChannel.length > 0) {
    return firstChannel
  }

  return null
}

export function drawMasterSpectrum(
  ctx: CanvasRenderingContext2D,
  frequencyData: Float32Array | Float32Array[],
  width: number,
  height: number,
  smoothBuffer: number[],
  sampleRate: number,
): void {
  const bins = resolveFrequencyBins(frequencyData)
  const columnCount = Math.floor(width)
  if (
    !bins ||
    !Number.isFinite(height) ||
    height <= 0 ||
    columnCount < 1 ||
    !Number.isFinite(sampleRate) ||
    sampleRate <= 0
  ) {
    return
  }

  ctx.fillStyle = readCssColorString('--color-canvas-bg', '#c8cdd2')
  ctx.fillRect(0, 0, width, height)

  if (smoothBuffer.length !== columnCount) {
    smoothBuffer.length = columnCount
    smoothBuffer.fill(0)
  }

  const nyquist = sampleRate / 2
  const binCount = bins.length

  // First pass: tilted dB value and per-column floor for every column
  const dbValues = new Float64Array(columnCount)
  const floorDbs = new Float64Array(columnCount)
  let framePeakDb = -Infinity

  for (let x = 0; x < columnCount; x++) {
    // Frequency bounds for this column (half-column on each side for bin aggregation)
    const logPosLow = (x - 0.5) / Math.max(1, columnCount - 1)
    const logPosMid = x / Math.max(1, columnCount - 1)
    const logPosHigh = (x + 0.5) / Math.max(1, columnCount - 1)

    const freqLow = MIN_FREQ * (MAX_FREQ / MIN_FREQ) ** Math.max(0, logPosLow)
    const frequency = MIN_FREQ * (MAX_FREQ / MIN_FREQ) ** logPosMid
    const freqHigh = MIN_FREQ * (MAX_FREQ / MIN_FREQ) ** Math.min(1, logPosHigh)

    const binStart = Math.max(0, Math.floor((freqLow / nyquist) * binCount))
    const binEnd = Math.min(binCount - 1, Math.ceil((freqHigh / nyquist) * binCount))

    let dbValue: number
    if (binEnd - binStart >= 2) {
      // Several bins per column: take the max (preserves transients)
      dbValue = -Infinity
      for (let b = binStart; b <= binEnd; b++) {
        const v = bins[b]
        if (v !== undefined && Number.isFinite(v) && v > dbValue) {
          dbValue = v
        }
      }
    } else {
      // Bin spans multiple columns: interpolate to avoid stair-step plateaus
      const exactBin = (frequency / nyquist) * binCount
      const lowerBin = Math.min(binCount - 1, Math.max(0, Math.floor(exactBin)))
      const upperBin = Math.min(binCount - 1, lowerBin + 1)
      const fraction = exactBin - lowerBin
      const lowerValue = bins[lowerBin] ?? -Infinity
      const upperValue = bins[upperBin] ?? -Infinity
      dbValue =
        Number.isFinite(lowerValue) && Number.isFinite(upperValue)
          ? lowerValue + (upperValue - lowerValue) * fraction
          : Math.max(lowerValue, upperValue)
    }

    // Spectral tilt: +3.5 dB/octave above pivot, -3.5 below — compensates for pink-noise rolloff.
    // The display floor rises with positive tilt so the (finite) noise floor stays at zero
    // height instead of being lifted into view at the high end.
    const tilt = TILT_DB_PER_OCTAVE * Math.log2(frequency / TILT_PIVOT_FREQ)
    dbValue += tilt
    const floorDb = FLOOR_DB + Math.max(0, tilt)
    if (!Number.isFinite(dbValue)) {
      dbValue = floorDb
    }

    dbValues[x] = dbValue
    floorDbs[x] = floorDb
    if (dbValue > framePeakDb) {
      framePeakDb = dbValue
    }
  }

  // Rise fast to track the loudest recent content, decay slowly when it fades
  const targetCeiling = Math.min(
    CEILING_MAX_DB,
    Math.max(CEILING_MIN_DB, framePeakDb + CEILING_HEADROOM_DB),
  )
  adaptiveCeilingDb =
    targetCeiling > adaptiveCeilingDb
      ? targetCeiling
      : Math.max(targetCeiling, adaptiveCeilingDb - CEILING_DECAY_DB_PER_FRAME)

  // Second pass: normalize against the adaptive ceiling
  const heights = new Float64Array(columnCount)
  for (let x = 0; x < columnCount; x++) {
    const floorDb = floorDbs[x]
    const range = adaptiveCeilingDb - floorDb
    const normalizedValue = range > 0 ? (dbValues[x] - floorDb) / range : 0
    heights[x] = Math.min(1, Math.max(0, normalizedValue)) * height
  }

  spatialSmooth(heights, Math.max(2, Math.round(columnCount / 180)), 2)

  // Final pass: temporal smoothing and draw
  ctx.beginPath()
  ctx.moveTo(0, height)

  for (let x = 0; x < columnCount; x++) {
    // Asymmetric smoothing: fast attack, slow release
    const prev = smoothBuffer[x] ?? 0
    smoothBuffer[x] =
      heights[x] > prev
        ? prev * 0.4 + heights[x] * 0.6
        : prev * 0.85 + heights[x] * 0.15

    ctx.lineTo(x, height - smoothBuffer[x])
  }

  ctx.lineTo(width, height)
  ctx.closePath()

  ctx.fillStyle = rgbaFromCssVar('--color-active', 0.4, [112, 92, 252])
  ctx.fill()

  // Crisp top-edge stroke
  ctx.beginPath()
  ctx.moveTo(0, height - (smoothBuffer[0] ?? 0))
  for (let x = 1; x < columnCount; x++) {
    ctx.lineTo(x, height - (smoothBuffer[x] ?? 0))
  }
  ctx.strokeStyle = rgbaFromCssVar('--color-active', 0.75, [112, 92, 252])
  ctx.lineWidth = 1
  ctx.stroke()
}
