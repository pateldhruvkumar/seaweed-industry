import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import TimeFilteredChartCard from './TimeFilteredChartCard'

function renderCard() {
  render(
    <TimeFilteredChartCard title="T">
      {range => <div data-testid="probe">{range.join('-')}</div>}
    </TimeFilteredChartCard>,
  )
}

function openList(label) {
  fireEvent.click(screen.getByRole('button', { name: label }))
  return screen.getByRole('listbox')
}

function pickYear(label, year) {
  const list = openList(label)
  fireEvent.click(within(list).getByRole('option', { name: String(year) }))
}

describe('TimeFilteredChartCard', () => {
  it('renders From/To year dropdowns instead of sliders', () => {
    renderCard()
    expect(screen.getByRole('button', { name: 'From year' })).toHaveTextContent('1950')
    expect(screen.getByRole('button', { name: 'To year' })).toHaveTextContent('2024')
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  })

  it('passes the chosen range to the render prop and closes the list', () => {
    renderCard()
    pickYear('From year', 1980)
    expect(screen.getByTestId('probe')).toHaveTextContent('1980-2024')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('constrains options so From can never exceed To', () => {
    renderCard()
    pickYear('To year', 2000)
    const fromList = openList('From year')
    const fromYears = within(fromList)
      .getAllByRole('option')
      .map(o => o.textContent)
    expect(fromYears[fromYears.length - 1]).toBe('2000')
    fireEvent.click(within(fromList).getByRole('option', { name: '1980' }))
    const toYears = within(openList('To year'))
      .getAllByRole('option')
      .map(o => o.textContent)
    expect(toYears[0]).toBe('1980')
    expect(screen.getByTestId('probe')).toHaveTextContent('1980-2000')
  })

  it('shows only five years at a time in the open list', () => {
    renderCard()
    const list = openList('From year')
    // 5 rows × 32px per row — anything past that scrolls
    expect(list).toHaveStyle({ maxHeight: '160px' })
    expect(list).toHaveClass('overflow-y-auto')
  })
})
