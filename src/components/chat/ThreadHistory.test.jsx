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
  it('renders nothing when closed', () => {
    seedTwo()
    const { container } = render(
      <ThreadHistory open={false} onSelect={noop} onDelete={noop} onNewChat={noop} onClose={noop} />
    )
    expect(container).toBeEmptyDOMElement()
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
