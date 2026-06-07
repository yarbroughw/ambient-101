import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MIXED_VALUE } from '../lib/scaleSteps'
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

  it('shows asterisk readout for mixed values', () => {
    const { container } = render(
      <ScaleTypeSelect
        value={MIXED_VALUE}
        onChange={vi.fn()}
        ariaLabel="Scale type"
        mixed
      />,
    )
    expect(container.querySelector('.scale-type-select__readout')).toHaveTextContent('*')
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
