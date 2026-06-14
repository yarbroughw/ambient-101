const STORAGE_KEY = 'ambient-101:lock-melody-tempo'
const LEGACY_STORAGE_KEY = 'ambient-101:pace-affects-melody'

export function loadLockMelodyTempo(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') {
      return true
    }
    if (stored === 'false') {
      return false
    }

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy === 'true') {
      return false
    }
    if (legacy === 'false') {
      return true
    }
  } catch {
    // ignore quota / privacy mode
  }

  return false
}

export function saveLockMelodyTempo(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // ignore quota / privacy mode
  }
}
