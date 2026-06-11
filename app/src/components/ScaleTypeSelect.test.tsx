import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ScaleTypeSelect } from './ScaleTypeSelect'

describe('ScaleTypeSelect', () => {
  it('shows abbreviated readout for the selected scale type', () => {
    render(
      <ScaleTypeSelect
        value="mixolydian"
        onChange={vi.fn()}
        ariaLabel="Scale type"
      />,
    )
    expect(screen.getByText('mixolyd.')).toBeInTheDocument()
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
