import { describe, expect, it, vi } from 'vitest'
import { applyEnvelopeOverride } from './loopVoice'
import type { InstrumentPolySynth } from './instruments/createInstrumentPolySynth'

function mockSynth() {
  const set = vi.fn()
  return { synth: { set } as unknown as InstrumentPolySynth, set }
}

describe('applyEnvelopeOverride', () => {
  it('sets the amplitude envelope on a plain synth instrument', () => {
    const { synth, set } = mockSynth()
    applyEnvelopeOverride(synth, 'pad', 0.4, 2.5)
    expect(set).toHaveBeenCalledWith({ envelope: { attack: 0.4, release: 2.5 } })
  })

  it('applies the envelope to both voices of a duo instrument', () => {
    const { synth, set } = mockSynth()
    applyEnvelopeOverride(synth, 'strings', 0.4, 2.5)
    expect(set).toHaveBeenCalledWith({
      voice0: { envelope: { attack: 0.4, release: 2.5 } },
      voice1: { envelope: { attack: 0.4, release: 2.5 } },
    })
  })

  it('only includes the stages that are overridden', () => {
    const { synth, set } = mockSynth()
    applyEnvelopeOverride(synth, 'pad', undefined, 3)
    expect(set).toHaveBeenCalledWith({ envelope: { release: 3 } })
  })

  it('does nothing when neither attack nor release is set', () => {
    const { synth, set } = mockSynth()
    applyEnvelopeOverride(synth, 'pad', undefined, undefined)
    expect(set).not.toHaveBeenCalled()
  })
})
