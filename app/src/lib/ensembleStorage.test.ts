import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_PACE_SCALE } from './globalPace'
import {
  createEnsemble,
  deleteEnsemble,
  listEnsembles,
  loadEnsemble,
  markEnsembleOpened,
  migrateLegacyStorage,
  nextAvailableEnsembleName,
  nextDefaultEnsembleName,
  saveEnsemble,
} from './ensembleStorage'
import { buildLoopPatternsPayload } from './loopStorage'
import { createTestPattern } from '../test/fixtures'

const INDEX_KEY = 'ambient-101:ensemble-index'
const LEGACY_LOOPS_KEY = 'ambient-101:loops'

describe('ensembleStorage', () => {
  it('returns an empty list when storage is empty', () => {
    expect(listEnsembles()).toEqual({ entries: [], lastOpenedId: null })
  })

  it('creates, loads, and saves an ensemble', () => {
    const pattern = createTestPattern({ id: 'loop-a', label: 'loop-a' })
    const entry = createEnsemble({
      name: 'ensemble 1',
      loops: [pattern],
      paceScale: 1.1,
    })

    expect(entry.name).toBe('ensemble 1')
    expect(entry.reelCount).toBe(1)

    const loaded = loadEnsemble(entry.id)
    expect(loaded?.loops).toEqual([
      {
        ...pattern,
        notes: [],
      },
    ])
    expect(loaded?.paceScale).toBe(1.1)

    const updatedPattern = createTestPattern({
      id: 'loop-b',
      label: 'loop-b',
      bpm: 108,
    })
    saveEnsemble(entry.id, { loops: [updatedPattern], paceScale: 0.9 })

    expect(loadEnsemble(entry.id)).toEqual({
      loops: [{ ...updatedPattern, notes: [] }],
      paceScale: 0.9,
    })

    const { entries } = listEnsembles()
    expect(entries).toHaveLength(1)
    expect(entries[0]?.reelCount).toBe(1)
    expect(entries[0]?.updatedAt).toBeGreaterThanOrEqual(entry.updatedAt)
  })

  it('deletes an ensemble and its payload', () => {
    const entry = createEnsemble({ name: 'ensemble 1', loops: [] })
    deleteEnsemble(entry.id)

    expect(loadEnsemble(entry.id)).toBeNull()
    expect(listEnsembles().entries).toEqual([])
  })

  it('auto-names default and template-based ensembles', () => {
    expect(nextDefaultEnsembleName([])).toBe('ensemble 1')
    expect(
      nextDefaultEnsembleName([{ name: 'ensemble 1' } as never]),
    ).toBe('ensemble 2')

    expect(nextAvailableEnsembleName('workshop starter', [])).toBe(
      'workshop starter',
    )
    expect(
      nextAvailableEnsembleName('workshop starter', [
        { name: 'workshop starter' } as never,
      ]),
    ).toBe('workshop starter 2')
  })

  it('does not mark a newly created ensemble as last opened', () => {
    const opened = createEnsemble({ name: 'ensemble 1', loops: [] })
    markEnsembleOpened(opened.id)

    const created = createEnsemble({ name: 'ensemble 2', loops: [] })
    expect(created.id).not.toBe(opened.id)
    expect(listEnsembles().lastOpenedId).toBe(opened.id)
  })

  it('marks the last opened ensemble in the index', () => {
    const first = createEnsemble({ name: 'ensemble 1', loops: [] })
    const second = createEnsemble({ name: 'ensemble 2', loops: [] })

    markEnsembleOpened(first.id)
    expect(listEnsembles().lastOpenedId).toBe(first.id)

    markEnsembleOpened(second.id)
    expect(listEnsembles().lastOpenedId).toBe(second.id)
  })

  it('migrates legacy loop storage into a single ensemble', () => {
    const pattern = createTestPattern({ id: 'legacy', label: 'legacy' })
    localStorage.setItem(
      LEGACY_LOOPS_KEY,
      JSON.stringify(buildLoopPatternsPayload([pattern])),
    )

    migrateLegacyStorage()

    expect(localStorage.getItem(LEGACY_LOOPS_KEY)).toBeNull()
    const { entries, lastOpenedId } = listEnsembles()
    expect(entries).toHaveLength(1)
    expect(entries[0]?.name).toBe('ensemble 1')
    expect(entries[0]?.reelCount).toBe(1)
    expect(lastOpenedId).toBe(entries[0]?.id)

    const loaded = loadEnsemble(entries[0]!.id)
    expect(loaded?.loops[0]?.id).toBe('legacy')
    expect(loaded?.paceScale).toBe(DEFAULT_PACE_SCALE)
  })

  it('does not recreate legacy storage when the index already exists', () => {
    createEnsemble({ name: 'ensemble 1', loops: [] })
    localStorage.setItem(
      LEGACY_LOOPS_KEY,
      JSON.stringify(
        buildLoopPatternsPayload([
          createTestPattern({ id: 'ghost', label: 'ghost' }),
        ]),
      ),
    )

    migrateLegacyStorage()

    expect(listEnsembles().entries).toHaveLength(1)
    expect(localStorage.getItem(LEGACY_LOOPS_KEY)).not.toBeNull()
  })

  it('ignores malformed index data', () => {
    localStorage.setItem(INDEX_KEY, '{not json')
    expect(listEnsembles()).toEqual({ entries: [], lastOpenedId: null })
  })
})

describe('createEnsemble id generation', () => {
  it('uses random UUIDs', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce(
      '00000000-0000-4000-8000-000000000001',
    )
    const entry = createEnsemble({ name: 'ensemble 1', loops: [] })
    expect(entry.id).toBe('00000000-0000-4000-8000-000000000001')
  })
})
