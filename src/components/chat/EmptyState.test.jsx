import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmptyState from './EmptyState'

describe('EmptyState', () => {
  it('renders the greeting headline and subhead', () => {
    render(<EmptyState onSubmit={() => {}} />)
    expect(screen.getByText('How can I help today?')).toBeInTheDocument()
    expect(
      screen.getByText(/Ask anything about global seaweed/i),
    ).toBeInTheDocument()
  })

  it('renders four suggestion chips', () => {
    render(<EmptyState onSubmit={() => {}} />)
    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  it('calls onSubmit with the chip prompt when clicked', async () => {
    const onSubmit = vi.fn()
    render(<EmptyState onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole('button', { name: /top 5 producers/i }))
    expect(onSubmit).toHaveBeenCalledWith('Top 5 producers in 2022')
  })
})
