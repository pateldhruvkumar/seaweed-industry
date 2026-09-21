import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThreadHistory from './ThreadHistory'
import { saveThread, deleteThread } from '../../lib/threadStore'

beforeEach(() => localStorage.clear())

function seedTwo() {
  const older = saveThread(null, [{ role: 'user', content: 'older chat', sql: null, data: [], type: null }])
  vi.spyOn(Date, 'now').mockReturnValue(older.updatedAt + 1000)
  const newer = saveThread(null, [{ role: 'user', content: 'newer chat', sql: null, data: [], type: null }])
  Date.now.mockRestore()
  return { older, newer }
}

const noop = () => {}

describe('ThreadHistory', () => {
  // The rail is always mounted so it can sit permanently beside the conversation
  // on desktop; `open` only drives the small-screen collapse, which is CSS-only.
  it('stays mounted when closed so the desktop rail always shows the list', () => {
    seedTwo()
    render(
      <ThreadHistory open={false} onSelect={noop} onDelete={noop} onNewChat={noop} onClose={noop} />
    )
    expect(screen.getByText('older chat')).toBeInTheDocument()
  })

  it('collapses on small screens when closed and expands when open', () => {
    seedTwo()
    const { rerender } = render(
      <ThreadHistory open={false} onSelect={noop} onDelete={noop} onNewChat={noop} onClose={noop} />
    )
    expect(screen.getByTestId('thread-rail')).toHaveClass('hidden')
    rerender(<ThreadHistory open onSelect={noop} onDelete={noop} onNewChat={noop} onClose={noop} />)
    expect(screen.getByTestId('thread-rail')).not.toHaveClass('hidden')
  })

  it('lists saved chats newest-first when open', () => {
    seedTwo()
    render(<ThreadHistory open onSelect={noop} onDelete={noop} onNewChat={noop} onClose={noop} />)
    // Anchored to the seeded titles so it doesn't also match the "New chat" button.
    const titles = screen.getAllByText(/^(?:newer|older) chat$/).map(el => el.textContent)
    expect(titles).toEqual(['newer chat', 'older chat'])
  })

  it('shows an empty state when there are no saved chats', () => {
    render(<ThreadHistory open onSelect={noop} onDelete={noop} onNewChat={noop} onClose={noop} />)
    expect(screen.getByText(/no saved chats/i)).toBeInTheDocument()
  })

  it('calls onSelect with the thread id when a row is clicked', async () => {
    const { newer } = seedTwo()
    const onSelect = vi.fn()
    render(<ThreadHistory open onSelect={onSelect} onDelete={noop} onNewChat={noop} onClose={noop} />)
    await userEvent.click(screen.getByText('newer chat'))
    expect(onSelect).toHaveBeenCalledWith(newer.id)
  })

  it('calls onDelete and refreshes the list when a delete button is clicked', async () => {
    const { older } = seedTwo()
    const onDelete = vi.fn(deleteThread)
    render(<ThreadHistory open onSelect={noop} onDelete={onDelete} onNewChat={noop} onClose={noop} />)
    await userEvent.click(screen.getByRole('button', { name: /delete older chat/i }))
    expect(onDelete).toHaveBeenCalledWith(older.id)
    expect(screen.queryByText('older chat')).toBeNull()
  })

  it('calls onNewChat when the New chat button is clicked', async () => {
    const onNewChat = vi.fn()
    render(<ThreadHistory open onSelect={noop} onDelete={noop} onNewChat={onNewChat} onClose={noop} />)
    await userEvent.click(screen.getByRole('button', { name: /new chat/i }))
    expect(onNewChat).toHaveBeenCalledOnce()
  })
})
