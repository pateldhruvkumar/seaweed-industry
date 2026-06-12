import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UserMessage from './UserMessage'

describe('UserMessage', () => {
  it('renders the message content', () => {
    render(<UserMessage content="hello there" />)
    expect(screen.getByText('hello there')).toBeInTheDocument()
  })

  it('shows no Edit button when onEdit is absent', () => {
    render(<UserMessage content="hello" />)
    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull()
  })

  it('opens an editor prefilled with the content when Edit is clicked', async () => {
    render(<UserMessage content="original text" onEdit={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByDisplayValue('original text')).toBeInTheDocument()
  })

  it('Cancel restores the bubble without calling onEdit', async () => {
    const onEdit = vi.fn()
    render(<UserMessage content="original text" onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    const editor = screen.getByDisplayValue('original text')
    await userEvent.clear(editor)
    await userEvent.type(editor, 'changed text')
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onEdit).not.toHaveBeenCalled()
    expect(screen.getByText('original text')).toBeInTheDocument()
    // a second edit starts from the original content again
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByDisplayValue('original text')).toBeInTheDocument()
  })

  it('Save calls onEdit with the trimmed edited text and closes the editor', async () => {
    const onEdit = vi.fn()
    render(<UserMessage content="original text" onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    const editor = screen.getByDisplayValue('original text')
    await userEvent.clear(editor)
    await userEvent.type(editor, '  new question  ')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onEdit).toHaveBeenCalledWith('new question')
    expect(screen.queryByDisplayValue(/new question/)).toBeNull()
  })

  it('disables Save when the draft is empty', async () => {
    render(<UserMessage content="original" onEdit={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    await userEvent.clear(screen.getByDisplayValue('original'))
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('Escape cancels and Enter saves from the textarea', async () => {
    const onEdit = vi.fn()
    render(<UserMessage content="original" onEdit={onEdit} />)
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    await userEvent.keyboard('{Escape}')
    expect(onEdit).not.toHaveBeenCalled()
    expect(screen.getByText('original')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    const editor = screen.getByDisplayValue('original')
    await userEvent.clear(editor)
    await userEvent.type(editor, 'via enter{Enter}')
    expect(onEdit).toHaveBeenCalledWith('via enter')
  })
})
