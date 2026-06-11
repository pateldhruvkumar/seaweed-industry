import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AssistantMessage from './AssistantMessage'

vi.mock('./ChatChart', () => ({ default: () => <div data-testid="chat-chart" /> }))

beforeEach(() => {
  vi.useFakeTimers()
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn(() => Promise.resolve()) },
  })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('AssistantMessage', () => {
  it('shows typing dots while content is empty and streaming', () => {
    render(<AssistantMessage content="" streaming={true} />)
    expect(screen.getByLabelText(/assistant is typing/i)).toBeInTheDocument()
  })

  it('progressively reveals targetContent over time', () => {
    render(<AssistantMessage content="" targetContent="hello world" streaming={true} />)
    act(() => { vi.advanceTimersByTime(18) })
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.getByTestId('assistant-body').textContent.length).toBeGreaterThan(0)
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.getByTestId('assistant-body').textContent).toContain('hello world')
  })

  it('renders the full content immediately when not streaming', () => {
    render(<AssistantMessage content="Done answer" streaming={false} />)
    expect(screen.getByTestId('assistant-body').textContent).toContain('Done answer')
  })

  it('renders the View SQL toggle and expands it on click', async () => {
    vi.useRealTimers()
    render(<AssistantMessage content="answer" sql="SELECT 1" streaming={false} />)
    expect(screen.queryByText('SELECT 1')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: /view sql/i }))
    expect(screen.getByText('SELECT 1')).toBeInTheDocument()
  })

  it('copies content to clipboard when Copy is clicked', async () => {
    vi.useRealTimers()
    render(<AssistantMessage content="copy me" streaming={false} />)
    await userEvent.click(screen.getByRole('button', { name: /^copy$/i }))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('copy me')
  })

  it('calls onRegenerate when Regenerate is clicked', async () => {
    vi.useRealTimers()
    const onRegenerate = vi.fn()
    render(
      <AssistantMessage
        content="answer"
        streaming={false}
        onRegenerate={onRegenerate}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /regenerate/i }))
    expect(onRegenerate).toHaveBeenCalledOnce()
  })

  it('renders a chart above the table for a chartable table result', () => {
    vi.useRealTimers()
    render(
      <AssistantMessage
        content="answer"
        type="table"
        data={[
          { Country_Name: 'China', total: 5 },
          { Country_Name: 'Japan', total: 3 },
        ]}
        streaming={false}
      />,
    )
    const chart = screen.getByTestId('chat-chart')
    const table = screen.getByRole('table')
    expect(chart).toBeInTheDocument()
    // chart must appear before the table in the DOM
    expect(chart.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('does not render a chart for a single-row (scalar) result', () => {
    vi.useRealTimers()
    render(<AssistantMessage content="answer" type="scalar" data={[{ n: 5 }]} streaming={false} />)
    expect(screen.queryByTestId('chat-chart')).toBeNull()
  })

  it('renders suggestion chips and calls onSuggestion when clicked', async () => {
    vi.useRealTimers()
    const onSuggestion = vi.fn()
    render(
      <AssistantMessage
        content="answer"
        type="table"
        data={[{ Country_Name: 'China', total: 5 }, { Country_Name: 'Japan', total: 3 }]}
        streaming={false}
        suggestions={['Compare to 2010', 'Show top 3']}
        onSuggestion={onSuggestion}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Compare to 2010' }))
    expect(onSuggestion).toHaveBeenCalledWith('Compare to 2010')
  })

  it('does not render chips when onSuggestion is absent', () => {
    vi.useRealTimers()
    render(
      <AssistantMessage
        content="answer"
        type="table"
        data={[{ Country_Name: 'China', total: 5 }, { Country_Name: 'Japan', total: 3 }]}
        streaming={false}
        suggestions={['Compare to 2010']}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Compare to 2010' })).toBeNull()
  })
})
