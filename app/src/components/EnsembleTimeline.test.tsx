import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EnsembleTimeline } from './EnsembleTimeline'
import type { TapeLoop } from '../audio/tapeLoop'
import type { DemoLoop } from '../audio/demoPatterns'
import { createTestNote, createTestPattern } from '../test/fixtures'

const LANE_WIDTH = 440

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

let rafQueue: FrameRequestCallback[] = []

function flushFrame() {
  act(() => {
    const callbacks = [...rafQueue]
    rafQueue = []
    for (const callback of callbacks) {
      callback(performance.now())
    }
  })
}

beforeEach(() => {
  rafQueue = []
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    rafQueue.push(cb)
    return rafQueue.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => LANE_WIDTH,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth
})

describe('EnsembleTimeline seam behavior', () => {
  it('keeps a glowing note in its own lap tile when the playhead wraps', () => {
    // 1.5s tape, 24 cols at 240bpm (62.5ms steps): first note at col 0,
    // last note at col 22 (t = 1.375s).
    const pattern = createTestPattern({
      loopDurationMs: 1_500,
      bpm: 240,
      loopCols: 24,
      notes: [
        createTestNote({ scaleStep: 0, startCol: 0, spanCols: 2 }),
        createTestNote({ scaleStep: 2, startCol: 22, spanCols: 2 }),
      ],
    })
    let progress = 0.9
    const loop = {
      getProgress: () => progress,
      isTesting: () => false,
      getLoopTimeSec: () => progress * (pattern.loopDurationMs / 1000),
    } as unknown as TapeLoop
    const loops = [{ pattern, loop }] as unknown as DemoLoop[]

    const { container } = render(
      <EnsembleTimeline
        loops={loops}
        runningById={{ [pattern.id]: true }}
        motion="fixed-rate"
        zoomStop={0}
      />,
    )

    const flashes = () =>
      [...container.querySelectorAll('.mini-melody__note--flash')].map(
        (note) => ({
          note: (note as HTMLElement).style.left,
          tile: (note.closest('.ensemble-timeline__tile') as HTMLElement)
            .style.left,
        }),
      )

    const strip = () =>
      (container.querySelector('.ensemble-timeline__strip') as HTMLElement)
        .style.transform

    flushFrame() // prime: phase 0.9, lap 0
    progress = 0.93 // crosses the last note (phase 22/24 ≈ 0.917)
    flushFrame()

    const tileWidth = 1.5 * (LANE_WIDTH / 10)
    expect(flashes()).toEqual([
      { note: `${(22 / 24) * 100}%`, tile: '0px' },
    ])

    progress = 0.99
    flushFrame()
    const xBefore = parseFloat(/-?[\d.]+/.exec(strip())![0])

    progress = 0.01 // wrap: lap 1
    flushFrame()
    const xAfter = parseFloat(/-?[\d.]+/.exec(strip())![0])

    // The strip keeps scrolling continuously across the seam (no tile-width
    // jump), and the first-note flash lands in the *new* lap's tile while
    // the still-glowing last note stays in the previous lap's tile.
    expect(Math.abs(xAfter - xBefore)).toBeLessThan(tileWidth / 2)
    expect(flashes()).toEqual([
      { note: `${(22 / 24) * 100}%`, tile: '0px' },
      { note: '0%', tile: `${tileWidth}px` },
    ])
  })
})
