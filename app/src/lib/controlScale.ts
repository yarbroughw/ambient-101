export type ControlScale = 'linear' | 'log'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function valueToControlRatio(
  value: number,
  min: number,
  max: number,
  scale: ControlScale,
): number {
  const clamped = clamp(value, min, max)
  if (scale === 'log') {
    return Math.log(clamped / min) / Math.log(max / min)
  }
  return (clamped - min) / (max - min)
}

export function controlRatioToValue(
  ratio: number,
  min: number,
  max: number,
  scale: ControlScale,
): number {
  const clampedRatio = clamp(ratio, 0, 1)
  if (scale === 'log') {
    return min * (max / min) ** clampedRatio
  }
  return min + clampedRatio * (max - min)
}

/** Ratio-space step size for one `step` increment at `value`. */
export function controlStepRatio(
  value: number,
  step: number,
  min: number,
  max: number,
  scale: ControlScale,
): number {
  if (scale === 'log') {
    const up = clamp(value + step, min, max)
    return valueToControlRatio(up, min, max, scale) - valueToControlRatio(value, min, max, scale)
  }
  return step / (max - min)
}
