const STORAGE_KEY = 'ambient-101:pace-affects-melody'

export function loadPaceAffectsMelody(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') {
      return true
    }
    if (stored === 'false') {
      return false
    }
  } catch {
    // ignore quota / privacy mode
  }

  return false
}

export function savePaceAffectsMelody(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // ignore quota / privacy mode
  }
}
