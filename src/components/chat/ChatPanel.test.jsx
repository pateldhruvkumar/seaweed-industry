import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatPanel from './ChatPanel'

function mockFetchResponse(answer) {
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        answer,
        sql: 'SELECT 1',
        data: [],
        type: 'table',
        chart: null,
        suggestions: [],
      }),
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ChatPanel edit & resend', () => {
  it('editing a user message truncates the thread and resends from that point', async () => {
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(mockFetchResponse('first answer'))
      .mockReturnValueOnce(mockFetchResponse('second answer'))
      .mockReturnValueOnce(mockFetchResponse('edited answer'))
    vi.stubGlobal('fetch', fetchMock)

    render(<ChatPanel onClose={() => {}} />)

    const input = screen.getByPlaceholderText(/ask anything/i)
    await userEvent.type(input, 'first question{Enter}')
    await screen.findByText('first answer')
    await userEvent.type(input, 'second question{Enter}')
    await screen.findByText('second answer')

    // Edit the FIRST user message
    await userEvent.click(screen.getAllByRole('button', { name: /^edit$/i })[0])
    const editor = screen.getByDisplayValue('first question')
    await userEvent.clear(editor)
    await userEvent.type(editor, 'edited question')
    await userEvent.click(screen.getByRole('button', { name: /save & resend/i }))

    await screen.findByText('edited answer')

    // Branch-by-discard: everything after the edited message is gone
    expect(screen.getByText('edited question')).toBeInTheDocument()
    expect(screen.queryByText('first question')).toBeNull()
    expect(screen.queryByText('first answer')).toBeNull()
    expect(screen.queryByText('second question')).toBeNull()
    expect(screen.queryByText('second answer')).toBeNull()

    // The resend hit the API with the truncated history
    expect(fetchMock).toHaveBeenCalledTimes(3)
    const body = JSON.parse(fetchMock.mock.calls[2][1].body)
    expect(body.message).toBe('edited question')
    expect(body.history).toEqual([{ role: 'user', content: 'edited question' }])
  })

  it('editing a later message keeps earlier turns intact', async () => {
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(mockFetchResponse('first answer'))
      .mockReturnValueOnce(mockFetchResponse('second answer'))
      .mockReturnValueOnce(mockFetchResponse('edited answer'))
    vi.stubGlobal('fetch', fetchMock)

    render(<ChatPanel onClose={() => {}} />)

    const input = screen.getByPlaceholderText(/ask anything/i)
    await userEvent.type(input, 'first question{Enter}')
    await screen.findByText('first answer')
    await userEvent.type(input, 'second question{Enter}')
    await screen.findByText('second answer')

    // Edit the SECOND user message (thread index 2)
    await userEvent.click(screen.getAllByRole('button', { name: /^edit$/i })[1])
    const editor = screen.getByDisplayValue('second question')
    await userEvent.clear(editor)
    await userEvent.type(editor, 'better second question')
    await userEvent.click(screen.getByRole('button', { name: /save & resend/i }))

    await screen.findByText('edited answer')

    // Earlier turn survives; the old second turn is replaced
    expect(screen.getByText('first question')).toBeInTheDocument()
    expect(screen.getByText('first answer')).toBeInTheDocument()
    expect(screen.getByText('better second question')).toBeInTheDocument()
    expect(screen.queryByText('second question')).toBeNull()
    expect(screen.queryByText('second answer')).toBeNull()

    // History sent = first user msg + first answer + the edited user msg
    const body = JSON.parse(fetchMock.mock.calls[2][1].body)
    expect(body.message).toBe('better second question')
    expect(body.history.map(m => m.role)).toEqual(['user', 'assistant', 'user'])
    expect(body.history[2].content).toBe('better second question')
  })
})
