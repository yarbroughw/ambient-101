import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DemoLoop } from '../audio/demoPatterns'
import type { TapeLoop } from '../audio/tapeLoop'
import { createTestPattern } from '../test/fixtures'
import { TimelineFullscreenOverlay } from './TimelineFullscreenOverlay'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 800,
  })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => 600,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.style.overflow = ''
  delete (HTMLElement.prototype as { clientWidth?: number }).clientWidth
  delete (HTMLElement.prototype as { clientHeight?: number }).clientHeight
})

function renderOverlay(onClose = vi.fn()) {
  const pattern = createTestPattern()
  const loop = {
    getProgress: () => 0,
    isTesting: () => false,
    getLoopTimeSec: () => 0,
  } as unknown as TapeLoop
  const loops = [{ pattern, loop }] as unknown as DemoLoop[]

  return {
    onClose,
    ...render(
      <TimelineFullscreenOverlay
        loops={loops}
        runningById={{}}
        motion="fixed-rate"
        zoomStop={0}
        onMotionChange={vi.fn()}
        onZoomStopChange={vi.fn()}
        onClose={onClose}
      />,
    ),
  }
}

describe('TimelineFullscreenOverlay', () => {
  it('renders a fullscreen timeline', () => {
    renderOverlay()
    expect(screen.getByRole('dialog', { name: 'Fullscreen timeline' })).toBeInTheDocument()
    expect(
      document.querySelector('.ensemble-timeline--fullscreen'),
    ).toBeInTheDocument()
  })

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderOverlay(onClose)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('locks body scroll while open', () => {
    renderOverlay()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('omits hover tooltips on overlay controls', () => {
    renderOverlay()
    expect(screen.getByRole('button', { name: 'Exit fullscreen timeline' })).not.toHaveAttribute(
      'title',
    )
    expect(screen.getByRole('button', { name: 'rate' })).not.toHaveAttribute('title')
    expect(screen.getByRole('button', { name: 'width' })).not.toHaveAttribute('title')
  })
})
