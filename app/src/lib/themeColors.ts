function parseHexColor(value: string): [number, number, number] | null {
  const hex = value.replace('#', '')
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16)
    const g = parseInt(hex[1] + hex[1], 16)
    const b = parseInt(hex[2] + hex[2], 16)
    return [r, g, b]
  }

  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    if ([r, g, b].some((channel) => Number.isNaN(channel))) {
      return null
    }
    return [r, g, b]
  }

  return null
}

function parseRgbColor(value: string): [number, number, number] | null {
  const match = value.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i,
  )
  if (!match) {
    return null
  }

  return [
    Math.round(Number(match[1])),
    Math.round(Number(match[2])),
    Math.round(Number(match[3])),
  ]
}

export function readCssColor(
  varName: string,
  fallback: [number, number, number],
): [number, number, number] {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()

  if (!raw) {
    return fallback
  }

  return parseHexColor(raw) ?? parseRgbColor(raw) ?? fallback
}

export function readCssColorString(varName: string, fallback: string): string {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim()

  return raw || fallback
}

export function rgbaFromCssVar(
  varName: string,
  alpha: number,
  fallback: [number, number, number],
): string {
  const [r, g, b] = readCssColor(varName, fallback)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
