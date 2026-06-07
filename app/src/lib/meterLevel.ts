/**
 * Tone Meter with normalRange:true returns RMS amplitude (not dB).
 * On this pad chain, peaks are typically ~0.02–0.16.
 */
const RMS_REFERENCE = 0.06

export function normalizeMeterLevel(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) {
    return 0
  }

  const linear = raw / RMS_REFERENCE
  return Math.min(1, Math.pow(linear, 0.6))
}
