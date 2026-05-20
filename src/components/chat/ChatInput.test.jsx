import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatInput from './ChatInput'

describe('ChatInput', () => {
  it('submits the trimmed value on Enter and clears the input', async () => {
    const onSubmit = vi.fn()
    render(<ChatInput onSubmit={onSubmit} loading={false} onStop={() => {}} />)
    const ta = screen.getByPlaceholderText(/Ask anything about seaweed data/i)
    await userEvent.type(ta, '  hello  ')
    fireEvent.keyDown(ta, { key: 'Enter' })
    expect(onSubmit).toHaveBeenCalledWith('hello')
    expect(ta.value).toBe('')
  })

  it('does not submit on Shift+Enter', async () => {
    const onSubmit = vi.fn()
    render(<ChatInput onSubmit={onSubmit} loading={false} onStop={() => {}} />)
    const ta = screen.getByPlaceholderText(/Ask anything about seaweed data/i)
    await userEvent.type(ta, 'hi')
    fireEvent.keyDown(ta, { key: 'Enter', shiftKey: true })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows the stop button when loading and calls onStop when clicked', async () => {
    const onStop = vi.fn()
    render(<ChatInput onSubmit={() => {}} loading={true} onStop={onStop} />)
    await userEvent.click(screen.getByRole('button', { name: /stop/i }))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('disables submit when input is empty', () => {
    render(<ChatInput onSubmit={() => {}} loading={false} onStop={() => {}} />)
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })
})
