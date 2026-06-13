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

function deferred() {
  let resolve
  const promise = new Promise(r => { resolve = r })
  return { promise, resolve }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ChatPanel pending indicator', () => {
  it('shows a thinking indicator while the request is in flight', async () => {
    const pending = deferred()
    const fetchMock = vi.fn().mockReturnValueOnce(pending.promise)
    vi.stubGlobal('fetch', fetchMock)

    render(<ChatPanel onClose={() => {}} />)

    const input = screen.getByPlaceholderText(/ask anything/i)
    await userEvent.type(input, 'slow question{Enter}')

    expect(screen.getByLabelText(/assistant is typing/i)).toBeInTheDocument()

    pending.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          answer: 'slow answer',
          sql: null,
          data: [],
          type: 'table',
          chart: null,
          suggestions: [],
        }),
    })

    await screen.findByText('slow answer')
    expect(screen.queryByLabelText(/assistant is typing/i)).toBeNull()
  })
})

describe('ChatPanel error replies', () => {
  it('shows the backend error message in the error bubble', async () => {
    const fetchMock = vi.fn().mockReturnValue(
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            answer: 'Only read queries are supported.',
            sql: 'WITH t AS (SELECT 1) SELECT * FROM t',
            data: [],
            type: 'error',
            chart: null,
            suggestions: [],
          }),
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<ChatPanel onClose={() => {}} />)

    const input = screen.getByPlaceholderText(/ask anything/i)
    await userEvent.type(input, 'growth question{Enter}')

    await screen.findByText('Only read queries are supported.')
  })
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
    // Known quirk: assistant content stays '' in the messages array (the
    // typewriter reveals targetContent locally and never writes back).
    expect(body.history[1].content).toBe('')
  })

  it('discards an in-flight response that was superseded by an edit', async () => {
    const first = deferred()
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(mockFetchResponse('edited answer'))
    vi.stubGlobal('fetch', fetchMock)

    render(<ChatPanel onClose={() => {}} />)

    const input = screen.getByPlaceholderText(/ask anything/i)
    await userEvent.type(input, 'first question{Enter}')

    // While the first request is still in flight, edit the message and resend.
    await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
    const editor = screen.getByDisplayValue('first question')
    await userEvent.clear(editor)
    await userEvent.type(editor, 'edited question')
    await userEvent.click(screen.getByRole('button', { name: /save & resend/i }))

    // The stale response arrives late (our stub ignores the abort signal).
    first.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          answer: 'ghost answer',
          sql: null,
          data: [],
          type: 'table',
          chart: null,
          suggestions: [],
        }),
    })

    await screen.findByText('edited answer')
    expect(screen.queryByText('ghost answer')).toBeNull()
  })

  it('discards an in-flight error from a request superseded by an edit', async () => {
    const first = deferred()
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(mockFetchResponse('edited answer'))
    vi.stubGlobal('fetch', fetchMock)

    render(<ChatPanel onClose={() => {}} />)

    const input = screen.getByPlaceholderText(/ask anything/i)
    await userEvent.type(input, 'first question{Enter}')

    // Supersede the in-flight request with an edit.
    await userEvent.click(screen.getByRole('button', { name: /^edit$/i }))
    const editor = screen.getByDisplayValue('first question')
    await userEvent.clear(editor)
    await userEvent.type(editor, 'edited question')
    await userEvent.click(screen.getByRole('button', { name: /save & resend/i }))

    // The superseded request now fails with a real (non-abort) error.
    first.resolve({ ok: false, status: 500 })

    await screen.findByText('edited answer')
    expect(screen.queryByText(/something went wrong/i)).toBeNull()
  })
})
