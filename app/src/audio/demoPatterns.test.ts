import { describe, expect, it } from 'vitest'
import {
  duplicatePattern,
  importPattern,
  nextAvailableIdAndLabel,
  nextDuplicateIdAndLabel,
} from './demoPatterns'
import { createTestLoopEntry, createTestPattern } from '../test/fixtures'

describe('nextAvailableIdAndLabel', () => {
  it('returns the base label when unused', () => {
    expect(nextAvailableIdAndLabel('loop', [])).toEqual({
      id: 'loop',
      label: 'loop',
    })
  })

  it('increments numeric suffix when base label is taken', () => {
    const loops = [createTestLoopEntry(createTestPattern({ id: 'loop2', label: 'loop2' }))]
    expect(nextAvailableIdAndLabel('loop2', loops)).toEqual({
      id: 'loop3',
      label: 'loop3',
    })
  })

  it('appends 2 when plain base label collides', () => {
    const loops = [createTestLoopEntry(createTestPattern({ id: 'loop', label: 'loop' }))]
    expect(nextAvailableIdAndLabel('loop', loops)).toEqual({
      id: 'loop2',
      label: 'loop2',
    })
  })
})

describe('nextDuplicateIdAndLabel', () => {
  it('uses dash suffix for labels without trailing numbers', () => {
    expect(nextDuplicateIdAndLabel('melody', [])).toEqual({
      id: 'melody-2',
      label: 'melody-2',
    })
  })

  it('increments trailing numbers when present', () => {
    const loops = [createTestLoopEntry(createTestPattern({ id: 'melody3', label: 'melody3' }))]
    expect(nextDuplicateIdAndLabel('melody2', loops)).toEqual({
      id: 'melody4',
      label: 'melody4',
    })
  })
})

describe('duplicatePattern', () => {
  it('copies notes and assigns a new id and label', () => {
    const source = createTestPattern({
      id: 'source',
      label: 'source',
      notes: [{ scaleStep: 0, startCol: 0, spanCols: 2, velocity: 0.5 }],
    })
    const duplicate = duplicatePattern(source, [createTestLoopEntry(source)])
    expect(duplicate.id).toBe('source-2')
    expect(duplicate.label).toBe('source-2')
    expect(duplicate.notes).toEqual(source.notes)
    expect(duplicate.notes).not.toBe(source.notes)
  })
})

describe('importPattern', () => {
  it('keeps imported label when unused and assigns fresh id', () => {
    const source = createTestPattern({
      id: 'remote-id',
      label: 'imported',
      notes: [{ scaleStep: 1, startCol: 2, spanCols: 3 }],
    })
    const imported = importPattern(source, [])
    expect(imported.id).toBe('imported')
    expect(imported.label).toBe('imported')
    expect(imported.notes).toEqual(source.notes)
  })

  it('renumbers label when it collides with an existing reel', () => {
    const existing = createTestLoopEntry(
      createTestPattern({ id: 'bass', label: 'bass' }),
    )
    const source = createTestPattern({ id: 'shared-copy', label: 'bass' })
    const imported = importPattern(source, [existing])
    expect(imported.id).toBe('bass2')
    expect(imported.label).toBe('bass2')
  })
})
