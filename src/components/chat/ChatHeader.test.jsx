import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatHeader from './ChatHeader'

describe('ChatHeader', () => {
  it('renders the PSIA AI title and subtitle', () => {
    render(<ChatHeader onClose={() => {}} />)
    expect(screen.getByText('PSIA AI')).toBeInTheDocument()
    expect(screen.getByText('Ask your data')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    render(<ChatHeader onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
