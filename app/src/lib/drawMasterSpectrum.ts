const MIN_FREQ = 20
const MAX_FREQ = 6000
const FLOOR_DB = -120
const CEILING_DB = 0

export function drawMasterSpectrum(
  ctx: CanvasRenderingContext2D,
  frequencyData: Float32Array,
  width: number,
  height: number,
  smoothBuffer: number[],
  sampleRate: number,
): void {
  ctx.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-canvas-bg')
    .trim() || '#c8cdd2'
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = 'rgba(112, 92, 252, 0.4)'
  ctx.beginPath()
  ctx.moveTo(0, height)

  if (smoothBuffer.length !== width) {
    smoothBuffer.length = width
    smoothBuffer.fill(0)
  }

  for (let x = 0; x < width; x++) {
    const logPos = x / Math.max(1, width - 1)
    const frequency = MIN_FREQ * (MAX_FREQ / MIN_FREQ) ** logPos
    const exactBin = (frequency / (sampleRate / 2)) * frequencyData.length
    const lowerBin = Math.floor(exactBin)
    const upperBin = Math.min(lowerBin + 1, frequencyData.length - 1)
    const fraction = exactBin - lowerBin

    const lowerValue = Math.max(frequencyData[lowerBin], FLOOR_DB)
    const upperValue = Math.max(frequencyData[upperBin], FLOOR_DB)
    const dbValue = lowerValue + (upperValue - lowerValue) * fraction

    const normalizedValue = (dbValue - FLOOR_DB) / (CEILING_DB - FLOOR_DB)
    const scaledValue = Math.pow(Math.min(1, Math.max(0, normalizedValue)), 0.5)
    const currentHeight = scaledValue * height

    smoothBuffer[x] = smoothBuffer[x] * 0.7 + currentHeight * 0.3

    const y = height - smoothBuffer[x]
    ctx.lineTo(x, y)
  }

  ctx.lineTo(width, height)
  ctx.closePath()
  ctx.fill()
}
