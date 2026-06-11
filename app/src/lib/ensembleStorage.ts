import type { LoopPattern } from '../audio/patternTypes'
import {
  clampPaceScale,
  DEFAULT_PACE_SCALE,
} from './globalPace'
import {
  buildLoopPatternsPayload,
  parseLoopPatternsJson,
  parseLoopPatternsValue,
} from './loopStorage'

const INDEX_KEY = 'ambient-101:ensemble-index'
const LEGACY_LOOPS_KEY = 'ambient-101:loops'
const ENSEMBLE_KEY_PREFIX = 'ambient-101:ensemble:'
const INDEX_VERSION = 1
const PAYLOAD_VERSION = 1

export type EnsembleEntry = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  reelCount: number
}

type EnsembleIndex = {
  version: number
  lastOpenedId: string | null
  entries: EnsembleEntry[]
}

export type EnsembleData = {
  loops: LoopPattern[]
  paceScale: number
}

type EnsemblePayload = {
  version: number
  loops: LoopPattern[]
  paceScale?: number
}

function ensemblePayloadKey(id: string): string {
  return `${ENSEMBLE_KEY_PREFIX}${id}`
}

function readIndex(): EnsembleIndex {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    if (!raw) {
      return { version: INDEX_VERSION, lastOpenedId: null, entries: [] }
    }

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return { version: INDEX_VERSION, lastOpenedId: null, entries: [] }
    }

    const stored = parsed as Partial<EnsembleIndex>
    if (!Array.isArray(stored.entries)) {
      return { version: INDEX_VERSION, lastOpenedId: null, entries: [] }
    }

    const entries = stored.entries.filter(isEnsembleEntry)
    return {
      version: INDEX_VERSION,
      lastOpenedId:
        typeof stored.lastOpenedId === 'string' ? stored.lastOpenedId : null,
      entries,
    }
  } catch {
    return { version: INDEX_VERSION, lastOpenedId: null, entries: [] }
  }
}

function writeIndex(index: EnsembleIndex): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index))
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function isEnsembleEntry(value: unknown): value is EnsembleEntry {
  if (!value || typeof value !== 'object') {
    return false
  }

  const entry = value as EnsembleEntry
  return (
    typeof entry.id === 'string' &&
    entry.id.length > 0 &&
    typeof entry.name === 'string' &&
    entry.name.length > 0 &&
    typeof entry.createdAt === 'number' &&
    Number.isFinite(entry.createdAt) &&
    typeof entry.updatedAt === 'number' &&
    Number.isFinite(entry.updatedAt) &&
    typeof entry.reelCount === 'number' &&
    Number.isFinite(entry.reelCount) &&
    entry.reelCount >= 0
  )
}

function parseEnsemblePayload(raw: string): EnsembleData {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return { loops: [], paceScale: DEFAULT_PACE_SCALE }
    }

    const stored = parsed as Partial<EnsemblePayload>
    const loops = parseLoopPatternsValue({
      version: 2,
      loops: Array.isArray(stored.loops) ? stored.loops : [],
    })
    const paceScale =
      typeof stored.paceScale === 'number' && Number.isFinite(stored.paceScale)
        ? clampPaceScale(stored.paceScale)
        : DEFAULT_PACE_SCALE

    return { loops, paceScale }
  } catch {
    return { loops: [], paceScale: DEFAULT_PACE_SCALE }
  }
}

function writeEnsemblePayload(id: string, data: EnsembleData): void {
  const payload: EnsemblePayload = {
    version: PAYLOAD_VERSION,
    loops: buildLoopPatternsPayload(data.loops).loops,
    paceScale: clampPaceScale(data.paceScale),
  }

  try {
    localStorage.setItem(ensemblePayloadKey(id), JSON.stringify(payload))
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function createEntry(
  name: string,
  reelCount: number,
  timestamp = Date.now(),
): EnsembleEntry {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: timestamp,
    updatedAt: timestamp,
    reelCount,
  }
}

export function nextDefaultEnsembleName(entries: EnsembleEntry[]): string {
  let number = 1
  while (entries.some((entry) => entry.name === `ensemble ${number}`)) {
    number += 1
  }
  return `ensemble ${number}`
}

export function nextAvailableEnsembleName(
  baseName: string,
  entries: EnsembleEntry[],
): string {
  if (!entries.some((entry) => entry.name === baseName)) {
    return baseName
  }

  let number = 2
  while (entries.some((entry) => entry.name === `${baseName} ${number}`)) {
    number += 1
  }
  return `${baseName} ${number}`
}

export function migrateLegacyStorage(): void {
  const index = readIndex()
  if (index.entries.length > 0) {
    return
  }

  let legacyRaw: string | null
  try {
    legacyRaw = localStorage.getItem(LEGACY_LOOPS_KEY)
  } catch {
    return
  }

  if (!legacyRaw) {
    return
  }

  const loops = parseLoopPatternsJson(legacyRaw)
  try {
    localStorage.removeItem(LEGACY_LOOPS_KEY)
  } catch {
    // ignore
  }

  if (loops.length === 0) {
    return
  }

  const entry = createEntry('ensemble 1', loops.length)
  writeEnsemblePayload(entry.id, { loops, paceScale: DEFAULT_PACE_SCALE })
  writeIndex({
    version: INDEX_VERSION,
    lastOpenedId: entry.id,
    entries: [entry],
  })
}

export function listEnsembles(): {
  entries: EnsembleEntry[]
  lastOpenedId: string | null
} {
  migrateLegacyStorage()
  const index = readIndex()
  const entries = [...index.entries].sort((a, b) => b.updatedAt - a.updatedAt)
  return { entries, lastOpenedId: index.lastOpenedId }
}

export function loadEnsemble(id: string): EnsembleData | null {
  migrateLegacyStorage()

  try {
    const raw = localStorage.getItem(ensemblePayloadKey(id))
    if (!raw) {
      return null
    }

    return parseEnsemblePayload(raw)
  } catch {
    return null
  }
}

export function saveEnsemble(id: string, data: EnsembleData): void {
  migrateLegacyStorage()
  const index = readIndex()
  const entryIndex = index.entries.findIndex((entry) => entry.id === id)
  if (entryIndex === -1) {
    return
  }

  const timestamp = Date.now()
  const nextEntry: EnsembleEntry = {
    ...index.entries[entryIndex],
    updatedAt: timestamp,
    reelCount: data.loops.length,
  }

  const nextEntries = [...index.entries]
  nextEntries[entryIndex] = nextEntry
  writeEnsemblePayload(id, data)
  writeIndex({ ...index, entries: nextEntries })
}

export function createEnsemble(options: {
  name: string
  loops: LoopPattern[]
  paceScale?: number
}): EnsembleEntry {
  migrateLegacyStorage()
  const index = readIndex()
  const entry = createEntry(options.name, options.loops.length)
  const data: EnsembleData = {
    loops: options.loops,
    paceScale: clampPaceScale(options.paceScale ?? DEFAULT_PACE_SCALE),
  }

  writeEnsemblePayload(entry.id, data)
  writeIndex({
    version: INDEX_VERSION,
    lastOpenedId: index.lastOpenedId,
    entries: [...index.entries, entry],
  })

  return entry
}

export function deleteEnsemble(id: string): void {
  migrateLegacyStorage()
  const index = readIndex()
  const nextEntries = index.entries.filter((entry) => entry.id !== id)
  if (nextEntries.length === index.entries.length) {
    return
  }

  try {
    localStorage.removeItem(ensemblePayloadKey(id))
  } catch {
    // ignore
  }

  writeIndex({
    version: INDEX_VERSION,
    lastOpenedId: index.lastOpenedId === id ? null : index.lastOpenedId,
    entries: nextEntries,
  })
}

export function markEnsembleOpened(id: string): void {
  migrateLegacyStorage()
  const index = readIndex()
  if (!index.entries.some((entry) => entry.id === id)) {
    return
  }

  writeIndex({ ...index, lastOpenedId: id })
}

export function getEnsembleEntry(id: string): EnsembleEntry | null {
  migrateLegacyStorage()
  return readIndex().entries.find((entry) => entry.id === id) ?? null
}

export function renameEnsemble(id: string, name: string): void {
  const trimmed = name.trim()
  if (!trimmed) {
    return
  }

  migrateLegacyStorage()
  const index = readIndex()
  const entryIndex = index.entries.findIndex((entry) => entry.id === id)
  if (entryIndex === -1) {
    return
  }

  const nextEntries = [...index.entries]
  nextEntries[entryIndex] = {
    ...nextEntries[entryIndex],
    name: trimmed,
    updatedAt: Date.now(),
  }
  writeIndex({ ...index, entries: nextEntries })
}

const ENSEMBLE_EXPORT_VERSION = 1

/** Shareable ensemble JSON: name + pace + the same loop shape as reel JSON. */
export function serializeEnsemble(id: string): string | null {
  const entry = getEnsembleEntry(id)
  const data = loadEnsemble(id)
  if (!entry || !data) {
    return null
  }

  return JSON.stringify(
    {
      version: ENSEMBLE_EXPORT_VERSION,
      name: entry.name,
      paceScale: data.paceScale,
      loops: buildLoopPatternsPayload(data.loops).loops,
    },
    null,
    2,
  )
}

export function parseEnsembleJson(raw: string): {
  name: string | null
  loops: LoopPattern[]
  paceScale: number
} | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null
  }

  const stored = parsed as Partial<EnsemblePayload> & { name?: unknown }
  if (!Array.isArray(stored.loops)) {
    return null
  }

  const loops = parseLoopPatternsValue({ version: 2, loops: stored.loops })
  if (loops.length !== stored.loops.length) {
    return null
  }

  const name =
    typeof stored.name === 'string' && stored.name.trim()
      ? stored.name.trim()
      : null
  const paceScale =
    typeof stored.paceScale === 'number' && Number.isFinite(stored.paceScale)
      ? clampPaceScale(stored.paceScale)
      : DEFAULT_PACE_SCALE

  return { name, loops, paceScale }
}
