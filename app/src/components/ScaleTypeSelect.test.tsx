import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScaleTypeSelect, scaleTypeReadoutLabel } from './ScaleTypeSelect'

class ResizeObserverStub {
  private callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }

  observe() {
    this.callback([], this)
  }

  unobserve() {}
  disconnect() {}
}

describe('scaleTypeReadoutLabel', () => {
  it('prefers abbreviated labels when space is tight', () => {
    expect(
      scaleTypeReadoutLabel('mixolydian', { preferFull: false }),
    ).toBe('mixolyd.')
  })

  it('uses full labels when there is room', () => {
    expect(
      scaleTypeReadoutLabel('mixolydian', { preferFull: true }),
    ).toBe('mixolydian')
  })
})

describe('ScaleTypeSelect', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 0,
    })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get: () => 120,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows abbreviated readout when the container is too narrow', () => {
    render(
      <ScaleTypeSelect
        value="mixolydian"
        onChange={vi.fn()}
        ariaLabel="Scale type"
      />,
    )
    expect(screen.getByText('mixolyd.')).toBeInTheDocument()
  })

  it('shows full readout when the container is wide enough', () => {
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get: () => 200,
    })
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
      configurable: true,
      get: () => 80,
    })

    const { container } = render(
      <ScaleTypeSelect
        value="mixolydian"
        onChange={vi.fn()}
        ariaLabel="Scale type"
      />,
    )
    expect(
      container.querySelector('.scale-type-select__readout:not(.scale-type-select__measure)'),
    ).toHaveTextContent('mixolydian')
  })

  it('keeps the remembered value visible with an asterisk when mixed', () => {
    const { container } = render(
      <ScaleTypeSelect
        value="dorian"
        onChange={vi.fn()}
        ariaLabel="Scale type"
        mixed
      />,
    )
    expect(
      container.querySelector('.scale-type-select__readout'),
    ).toHaveTextContent('dorian *')
  })

  it('calls onChange when a new option is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <ScaleTypeSelect
        value="minor"
        onChange={onChange}
        ariaLabel="Scale type"
      />,
    )

    await user.selectOptions(screen.getByRole('combobox', { name: 'Scale type' }), 'dorian')
    expect(onChange).toHaveBeenCalledWith('dorian')
  })
})
