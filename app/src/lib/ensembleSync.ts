function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const next = x % y
    x = y
    y = next
  }
  return x
}

function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return 0
  }
  return Math.abs((a * b) / gcd(a, b))
}

export function lcmMs(periodsMs: number[]): number {
  if (periodsMs.length === 0) {
    return 0
  }
  return periodsMs.reduce((acc, period) => lcm(acc, period), periodsMs[0])
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

/** Returns [g, u] with g = gcd(a, b) and u·a ≡ g (mod b). */
function egcd(a: number, b: number): [number, number] {
  let [oldR, r] = [a, b]
  let [oldU, u] = [1, 0]
  while (r !== 0) {
    const q = Math.floor(oldR / r)
    ;[oldR, r] = [r, oldR - q * r]
    ;[oldU, u] = [u, oldU - q * u]
  }
  return [oldR, oldU]
}

/**
 * Earliest time (ms) at or after nowMs when every reel hits its downbeat
 * together — the smallest t ≥ nowMs with t ≡ startMs[i] (mod periodMs[i])
 * for all reels. Start times and periods are exact scheduling facts, so this
 * is plain congruence arithmetic (CRT); no tolerance or phase sampling.
 * Start offsets that fall between the alignment grid (e.g. reels started a
 * few ms apart, or staggered so downbeats never coincide exactly) are
 * rounded to the nearest reachable alignment — the moment of closest
 * approach.
 */
export function nextSyncTimeMs(
  startsMs: number[],
  periodsMs: number[],
  nowMs: number,
): number {
  if (periodsMs.length === 0) {
    return nowMs
  }

  let result = mod(startsMs[0] ?? 0, periodsMs[0])
  let modulus = periodsMs[0]

  for (let index = 1; index < periodsMs.length; index += 1) {
    const period = periodsMs[index]
    const start = mod(startsMs[index] ?? 0, period)
    const [shared, inverse] = egcd(modulus, period)
    const diff = start - result

    const combined = lcm(modulus, period)
    const step = mod(Math.round(diff / shared) * inverse, period / shared)
    result = mod(result + modulus * step, combined)
    modulus = combined
  }

  if (result >= nowMs) {
    return result
  }
  return result + Math.ceil((nowMs - result) / modulus) * modulus
}

// Fixed-length civil approximations (not calendar months/years).
const SECONDS_PER_DAY = 86_400

// Largest first; each renders alongside the next-smaller unit (e.g. "3h 22m").
const DURATION_UNITS = [
  { label: 'y', sizeSec: 365 * SECONDS_PER_DAY },
  { label: 'mo', sizeSec: 30 * SECONDS_PER_DAY },
  { label: 'w', sizeSec: 7 * SECONDS_PER_DAY },
  { label: 'd', sizeSec: SECONDS_PER_DAY },
  { label: 'h', sizeSec: 3_600 },
  { label: 'm', sizeSec: 60 },
  { label: 's', sizeSec: 1 },
] as const

export type ReelPeriodsMs = {
  /** Pace-independent period from the pattern (snapped, exact ms). */
  composedMs: number
  /** Period as actually played under the current pace (rounded ms). */
  playbackMs: number
}

/**
 * Pace stretches every reel by one shared factor; returns it, or null when
 * per-reel clamping at extreme paces made the stretch non-uniform.
 */
export function sharedPaceFactor(periods: ReelPeriodsMs[]): number | null {
  if (periods.length === 0) {
    return null
  }
  const factor = periods[0].playbackMs / periods[0].composedMs
  if (!Number.isFinite(factor) || factor <= 0) {
    return null
  }
  const uniform = periods.every(
    (p) => Math.abs(p.playbackMs / p.composedMs - factor) < 1e-3,
  )
  return uniform ? factor : null
}

/**
 * Full ensemble cycle (ms) under pace. The cycle structure lives in the
 * composed periods — rounding each *stretched* period to ms destroys their
 * common divisors (1500/1510ms at 0.9× become 1667/1678ms, collapsing the
 * gcd from 10ms to 1ms and exploding the lcm ~11×), so take the composed
 * lcm and stretch it once.
 */
export function ensembleCycleMs(periods: ReelPeriodsMs[]): number {
  const factor = sharedPaceFactor(periods)
  if (factor === null) {
    return lcmMs(periods.map((p) => p.playbackMs))
  }
  return lcmMs(periods.map((p) => p.composedMs)) * factor
}

/** Time (ms) from nowMs until the reels' downbeats next coincide. */
export function timeUntilEnsembleSyncMs(
  periods: ReelPeriodsMs[],
  startsMs: number[],
  nowMs: number,
): number {
  const factor = sharedPaceFactor(periods)
  if (factor === null) {
    const playback = periods.map((p) => p.playbackMs)
    return nextSyncTimeMs(startsMs, playback, nowMs) - nowMs
  }

  // Map real time onto the composed timeline (t' = t / factor), solve the
  // congruences against the exact composed periods, then stretch back.
  const composed = periods.map((p) => p.composedMs)
  const scaledStarts = startsMs.map((start) => Math.round(start / factor))
  const scaledNow = nowMs / factor
  return (nextSyncTimeMs(scaledStarts, composed, scaledNow) - scaledNow) * factor
}

export function formatSyncDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0s'
  }
  if (seconds < 10) {
    return `${seconds.toFixed(1)}s`
  }
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }

  for (let index = 0; index < DURATION_UNITS.length - 1; index += 1) {
    const unit = DURATION_UNITS[index]
    if (seconds < unit.sizeSec) {
      continue
    }
    const minor = DURATION_UNITS[index + 1]
    const major = Math.floor(seconds / unit.sizeSec)
    const remainder = Math.round(
      (seconds - major * unit.sizeSec) / minor.sizeSec,
    )
    if (remainder * minor.sizeSec >= unit.sizeSec) {
      // The remainder rounded up to a whole major unit (e.g. 59m 60s):
      // reformat the carried total so it can promote to the next unit.
      return formatSyncDuration((major + 1) * unit.sizeSec)
    }
    if (remainder === 0) {
      return `${major}${unit.label}`
    }
    return `${major}${unit.label} ${remainder}${minor.label}`
  }

  return `${Math.round(seconds)}s`
}
