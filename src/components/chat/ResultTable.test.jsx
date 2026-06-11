import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResultTable from './ResultTable'

describe('ResultTable', () => {
  it('rounds float cells to two decimals', () => {
    render(<ResultTable data={[{ PERIOD: 1984, total_value: 1525262.0589999997 }]} />)
    expect(screen.getByText('1525262.06')).toBeInTheDocument()
    expect(screen.queryByText('1525262.0589999997')).not.toBeInTheDocument()
  })

  it('leaves integer and string cells unchanged', () => {
    render(<ResultTable data={[{ PERIOD: 1984, species: 'Kelp' }]} />)
    expect(screen.getByText('1984')).toBeInTheDocument()
    expect(screen.getByText('Kelp')).toBeInTheDocument()
  })

  it('renders an em dash for null cells', () => {
    render(<ResultTable data={[{ total_value: null }]} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
