import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResultTable from './ResultTable'

describe('ResultTable', () => {
  it('abbreviates large values with K/M', () => {
    render(<ResultTable data={[{ PERIOD: 1984, total_value: 1525262.0589999997, lbs: 20000 }]} />)
    expect(screen.getByText('1.53M')).toBeInTheDocument()
    expect(screen.getByText('20K')).toBeInTheDocument()
    expect(screen.queryByText('1525262.0589999997')).not.toBeInTheDocument()
  })

  it('rounds small float cells to two decimals without abbreviating', () => {
    render(<ResultTable data={[{ price: 12.345 }]} />)
    expect(screen.getByText('12.35')).toBeInTheDocument()
  })

  it('leaves years, small integers, and string cells unchanged', () => {
    render(<ResultTable data={[{ PERIOD: 1984, count: 53, species: 'Kelp' }]} />)
    expect(screen.getByText('1984')).toBeInTheDocument()
    expect(screen.getByText('53')).toBeInTheDocument()
    expect(screen.getByText('Kelp')).toBeInTheDocument()
  })

  it('keeps the exact value as a hover title on abbreviated cells', () => {
    render(<ResultTable data={[{ total_value: 1525262.0589999997 }]} />)
    expect(screen.getByText('1.53M')).toHaveAttribute('title', '1525262.0589999997')
  })

  it('renders an em dash for null cells', () => {
    render(<ResultTable data={[{ total_value: null }]} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
