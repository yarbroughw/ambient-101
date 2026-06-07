import { readCssColorString, rgbaFromCssVar } from './themeColors'

const MIN_FREQ = 20
const MAX_FREQ = 6000
const FLOOR_DB = -120
const CEILING_DB = 0

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

  ctx.fillStyle = rgbaFromCssVar('--color-active', 0.4, [112, 92, 252])
  ctx.beginPath()
  ctx.moveTo(0, height)

  if (smoothBuffer.length !== columnCount) {
    smoothBuffer.length = columnCount
    smoothBuffer.fill(0)
  }

  for (let x = 0; x < columnCount; x++) {
    const logPos = x / Math.max(1, columnCount - 1)
    const frequency = MIN_FREQ * (MAX_FREQ / MIN_FREQ) ** logPos
    const exactBin = (frequency / (sampleRate / 2)) * bins.length
    const lowerBin = Math.floor(exactBin)
    const upperBin = Math.min(lowerBin + 1, bins.length - 1)
    const fraction = exactBin - lowerBin

    const lowerValue = Math.max(bins[lowerBin] ?? FLOOR_DB, FLOOR_DB)
    const upperValue = Math.max(bins[upperBin] ?? FLOOR_DB, FLOOR_DB)
    const dbValue = lowerValue + (upperValue - lowerValue) * fraction

    const normalizedValue = (dbValue - FLOOR_DB) / (CEILING_DB - FLOOR_DB)
    const scaledValue = Math.pow(Math.min(1, Math.max(0, normalizedValue)), 0.5)
    const currentHeight = Number.isFinite(scaledValue) ? scaledValue * height : 0

    smoothBuffer[x] = smoothBuffer[x] * 0.7 + currentHeight * 0.3

    const y = height - smoothBuffer[x]
    ctx.lineTo(x, y)
  }

  ctx.lineTo(width, height)
  ctx.closePath()
  ctx.fill()
}
