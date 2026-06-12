import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TimeFilteredChartCard from './TimeFilteredChartCard'

function renderCard() {
  render(
    <TimeFilteredChartCard title="T">
      {range => <div data-testid="probe">{range.join('-')}</div>}
    </TimeFilteredChartCard>,
  )
}

describe('TimeFilteredChartCard', () => {
  it('renders From/To year dropdowns instead of sliders', () => {
    renderCard()
    expect(screen.getByLabelText('From year')).toHaveValue('1950')
    expect(screen.getByLabelText('To year')).toHaveValue('2024')
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  })

  it('passes the chosen range to the render prop', () => {
    renderCard()
    fireEvent.change(screen.getByLabelText('From year'), { target: { value: '1980' } })
    expect(screen.getByTestId('probe')).toHaveTextContent('1980-2024')
  })

  it('constrains options so From can never exceed To', () => {
    renderCard()
    fireEvent.change(screen.getByLabelText('To year'), { target: { value: '2000' } })
    const fromOptions = [...screen.getByLabelText('From year').options].map(o => o.value)
    expect(fromOptions[fromOptions.length - 1]).toBe('2000')
    fireEvent.change(screen.getByLabelText('From year'), { target: { value: '1980' } })
    const toOptions = [...screen.getByLabelText('To year').options].map(o => o.value)
    expect(toOptions[0]).toBe('1980')
    expect(screen.getByTestId('probe')).toHaveTextContent('1980-2000')
  })
})
