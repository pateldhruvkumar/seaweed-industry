import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatModal from './ChatModal'

afterEach(() => {
  // A leaked scroll lock would silently affect later suites.
  document.body.style.overflow = ''
})

describe('ChatModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <ChatModal open={false} onClose={() => {}}>
        <p>chat body</p>
      </ChatModal>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders its children when open', () => {
    render(
      <ChatModal open onClose={() => {}}>
        <p>chat body</p>
      </ChatModal>
    )
    expect(screen.getByText('chat body')).toBeInTheDocument()
  })

  it('exposes a labelled modal dialog for assistive tech', () => {
    render(
      <ChatModal open onClose={() => {}}>
        <p>chat body</p>
      </ChatModal>
    )
    const dialog = screen.getByRole('dialog', { name: /psia ai/i })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn()
    render(
      <ChatModal open onClose={onClose}>
        <p>chat body</p>
      </ChatModal>
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn()
    render(
      <ChatModal open onClose={onClose}>
        <p>chat body</p>
      </ChatModal>
    )
    await userEvent.click(screen.getByTestId('chat-modal-backdrop'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not call onClose when the dialog interior is clicked', async () => {
    const onClose = vi.fn()
    render(
      <ChatModal open onClose={onClose}>
        <button type="button">inside</button>
      </ChatModal>
    )
    await userEvent.click(screen.getByRole('button', { name: 'inside' }))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('locks body scroll while open', () => {
    render(
      <ChatModal open onClose={() => {}}>
        <p>chat body</p>
      </ChatModal>
    )
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body scroll when it closes', () => {
    const { rerender } = render(
      <ChatModal open onClose={() => {}}>
        <p>chat body</p>
      </ChatModal>
    )
    expect(document.body.style.overflow).toBe('hidden')
    rerender(
      <ChatModal open={false} onClose={() => {}}>
        <p>chat body</p>
      </ChatModal>
    )
    expect(document.body.style.overflow).toBe('')
  })
})
