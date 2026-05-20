# ASK AI Claude-Style Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the right-side ASK AI ChatPanel to look and feel like Claude's chat interface, branded with the PSIA teal palette — without changing the existing `/chat` backend contract.

**Architecture:** Decompose the chat panel into small, single-purpose components (`SparkAvatar`, `TypingDots`, `ChatHeader`, `EmptyState`, `AssistantMessage`). `ChatPanel` owns fetch state and a fake-streaming character reveal. Markdown rendering via `react-markdown` + `remark-gfm`. All teal accents pull from the existing `brand-*` Tailwind palette so no theme config changes are needed.

**Tech Stack:** React 18, Tailwind 3.4, Vite, Vitest + React Testing Library, `react-markdown`, `remark-gfm`.

**Spec:** [docs/superpowers/specs/2026-05-19-ask-ai-redesign-design.md](../specs/2026-05-19-ask-ai-redesign-design.md)

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `src/components/chat/SparkAvatar.jsx` | NEW | Teal-gradient circle with sparkle SVG; sized via `size` prop; reused in header, empty-state, assistant messages |
| `src/components/chat/TypingDots.jsx` | NEW | Three brand-400 dots, opacity-staggered animation; used while waiting for a response |
| `src/components/chat/ChatHeader.jsx` | NEW | Branded header (SparkAvatar + "PSIA AI" + close button) |
| `src/components/chat/EmptyState.jsx` | NEW | Greeting + four suggestion chips; calls `onSubmit(prompt)` when a chip is clicked |
| `src/components/chat/AssistantMessage.jsx` | NEW | Avatar + label + markdown body + hover actions + SQL toggle + table; owns the streaming character reveal |
| `src/components/chat/MessageBubble.jsx` | REWRITE | Thin router: user → inline pill, assistant → `AssistantMessage`, error → inline notice |
| `src/components/chat/MessageThread.jsx` | MODIFY | Renders `EmptyState` when empty; renders messages; no separate loading bubble (typing dots live inside the assistant message slot) |
| `src/components/chat/ChatInput.jsx` | REWRITE | Composer pill, auto-resize textarea (1→6 rows), send/stop button |
| `src/components/chat/ChatPanel.jsx` | MODIFY | State, fetch with `AbortController`, streaming-target wiring, regenerate handler, panel chrome (gradient bg, ChatHeader) |
| `src/App.jsx` | MODIFY | Widen panel from `w-80` to `w-96` |
| `src/components/chat/ResultTable.jsx` | unchanged | (Restyling done by the wrapper card in `AssistantMessage`) |
| `package.json` / lockfile | MODIFY | Add `react-markdown`, `remark-gfm` |

---

## Task 1: Install markdown dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Install packages**

Run:
```bash
npm install react-markdown@^9 remark-gfm@^4
```

Expected: two new entries in `package.json` `dependencies`; `package-lock.json` updated; no errors.

- [ ] **Step 2: Verify the dev server still boots**

Run: `npm run dev`
Expected: Vite prints `Local: http://localhost:5173/`. Then Ctrl+C to stop.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(chat): add react-markdown + remark-gfm for assistant rendering"
```

---

## Task 2: SparkAvatar

A presentational teal-gradient circle with a sparkle SVG inside.

**Files:**
- Create: `src/components/chat/SparkAvatar.jsx`
- Create: `src/components/chat/SparkAvatar.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/chat/SparkAvatar.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import SparkAvatar from './SparkAvatar'

describe('SparkAvatar', () => {
  it('renders at the requested size in pixels', () => {
    const { container } = render(<SparkAvatar size={48} />)
    const root = container.firstChild
    expect(root).toHaveStyle({ width: '48px', height: '48px' })
  })

  it('applies a glow shadow when withGlow is true', () => {
    const { container } = render(<SparkAvatar size={24} withGlow />)
    expect(container.firstChild.className).toMatch(/shadow-/)
  })

  it('omits the glow class when withGlow is false', () => {
    const { container } = render(<SparkAvatar size={24} />)
    expect(container.firstChild.className).not.toMatch(/shadow-\[/)
  })

  it('contains an SVG sparkle', () => {
    const { container } = render(<SparkAvatar size={24} />)
    expect(container.querySelector('svg')).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/chat/SparkAvatar.test.jsx`
Expected: FAIL — cannot resolve `./SparkAvatar`.

- [ ] **Step 3: Implement SparkAvatar**

Create `src/components/chat/SparkAvatar.jsx`:

```jsx
export default function SparkAvatar({ size = 24, withGlow = false }) {
  const glow = withGlow ? 'shadow-[0_0_24px_rgba(45,212,191,0.35)]' : ''
  return (
    <span
      aria-hidden="true"
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`inline-flex items-center justify-center rounded-full
                  bg-gradient-to-br from-brand-400 to-brand-700 ${glow}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: `${size * 0.55}px`, height: `${size * 0.55}px` }}
      >
        <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z" />
      </svg>
    </span>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/chat/SparkAvatar.test.jsx`
Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/SparkAvatar.jsx src/components/chat/SparkAvatar.test.jsx
git commit -m "feat(chat): add SparkAvatar gradient sparkle component"
```

---

## Task 3: TypingDots

Three small dots that fade in sequence — the "assistant is thinking" indicator.

**Files:**
- Create: `src/components/chat/TypingDots.jsx`
- Create: `src/components/chat/TypingDots.test.jsx`
- Modify: `tailwind.config.js` (add `typing` keyframe + animation)

- [ ] **Step 1: Write the failing test**

Create `src/components/chat/TypingDots.test.jsx`:

```jsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import TypingDots from './TypingDots'

describe('TypingDots', () => {
  it('renders three dots', () => {
    const { container } = render(<TypingDots />)
    const dots = container.querySelectorAll('[data-dot]')
    expect(dots).toHaveLength(3)
  })

  it('each dot uses the brand-400 background', () => {
    const { container } = render(<TypingDots />)
    container.querySelectorAll('[data-dot]').forEach(d => {
      expect(d.className).toMatch(/bg-brand-400/)
    })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/chat/TypingDots.test.jsx`
Expected: FAIL — cannot resolve `./TypingDots`.

- [ ] **Step 3: Add the typing keyframe to tailwind config**

In `tailwind.config.js`, extend `keyframes` and `animation`. Replace the existing `keyframes` and `animation` blocks with:

```js
animation: {
  'fade-in': 'fadeIn 240ms ease-out both',
  'typing-dot': 'typingDot 1.2s ease-in-out infinite',
},
keyframes: {
  fadeIn: {
    '0%': { opacity: '0', transform: 'translateY(4px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
  typingDot: {
    '0%, 80%, 100%': { opacity: '0.25', transform: 'translateY(0)' },
    '40%':           { opacity: '1',    transform: 'translateY(-2px)' },
  },
},
```

- [ ] **Step 4: Implement TypingDots**

Create `src/components/chat/TypingDots.jsx`:

```jsx
export default function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="Assistant is typing">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          data-dot
          className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-typing-dot"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  )
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/chat/TypingDots.test.jsx`
Expected: both tests pass.

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.js src/components/chat/TypingDots.jsx src/components/chat/TypingDots.test.jsx
git commit -m "feat(chat): add TypingDots indicator with brand-400 animated dots"
```

---

## Task 4: ChatHeader

Branded header with SparkAvatar, title/subtitle, and close button.

**Files:**
- Create: `src/components/chat/ChatHeader.jsx`
- Create: `src/components/chat/ChatHeader.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/chat/ChatHeader.test.jsx`:

```jsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/chat/ChatHeader.test.jsx`
Expected: FAIL — cannot resolve `./ChatHeader`.

- [ ] **Step 3: Implement ChatHeader**

Create `src/components/chat/ChatHeader.jsx`:

```jsx
import SparkAvatar from './SparkAvatar'

export default function ChatHeader({ onClose }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-white/60 backdrop-blur shadow-chrome">
      <div className="flex items-center gap-2">
        <SparkAvatar size={24} />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-gray-900">PSIA AI</span>
          <span className="text-[11px] text-brand-700">Ask your data</span>
        </div>
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 text-lg leading-none w-6 h-6 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
      >
        ✕
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/chat/ChatHeader.test.jsx`
Expected: both tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/ChatHeader.jsx src/components/chat/ChatHeader.test.jsx
git commit -m "feat(chat): add branded ChatHeader with PSIA AI mark"
```

---

## Task 5: EmptyState

Greeting + four suggestion chips that submit a starter prompt on click.

**Files:**
- Create: `src/components/chat/EmptyState.jsx`
- Create: `src/components/chat/EmptyState.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/chat/EmptyState.test.jsx`:

```jsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/chat/EmptyState.test.jsx`
Expected: FAIL — cannot resolve `./EmptyState`.

- [ ] **Step 3: Implement EmptyState**

Create `src/components/chat/EmptyState.jsx`:

```jsx
import SparkAvatar from './SparkAvatar'

const SUGGESTIONS = [
  { emoji: '📈', label: 'Top 5 producers in 2022' },
  { emoji: '🌏', label: 'Compare China vs Indonesia' },
  { emoji: '💰', label: 'Aquaculture value trend' },
  { emoji: '📊', label: 'Capture vs farming split' },
]

export default function EmptyState({ onSubmit }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 text-center animate-fade-in">
      <SparkAvatar size={48} withGlow />
      <h2 className="mt-4 text-xl font-semibold text-gray-900">
        How can I help today?
      </h2>
      <p className="mt-1 text-sm text-gray-500 max-w-xs">
        Ask anything about global seaweed production, trade, or trends.
      </p>
      <div className="mt-6 w-full space-y-2">
        {SUGGESTIONS.map(s => (
          <button
            key={s.label}
            type="button"
            onClick={() => onSubmit(s.label)}
            className="w-full text-left rounded-xl border border-gray-200 bg-white
                       px-3 py-2 text-sm text-gray-700 shadow-card
                       hover:border-brand-400 hover:bg-brand-50/50
                       transition-colors"
          >
            <span className="mr-2">{s.emoji}</span>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/chat/EmptyState.test.jsx`
Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/EmptyState.jsx src/components/chat/EmptyState.test.jsx
git commit -m "feat(chat): add EmptyState greeting with suggestion chips"
```

---

## Task 6: ChatInput composer rewrite

Replace the existing flat composer with the rounded pill, auto-resize textarea, and send/stop button.

**Files:**
- Modify: `src/components/chat/ChatInput.jsx` (full rewrite)
- Create: `src/components/chat/ChatInput.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/chat/ChatInput.test.jsx`:

```jsx
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/chat/ChatInput.test.jsx`
Expected: most assertions fail — placeholder/role mismatches against the current implementation.

- [ ] **Step 3: Rewrite ChatInput**

Replace the entire contents of `src/components/chat/ChatInput.jsx` with:

```jsx
import { useRef, useState, useEffect } from 'react'

const MAX_ROWS = 6
const LINE_HEIGHT_PX = 20

export default function ChatInput({ onSubmit, onStop, loading }) {
  const [value, setValue] = useState('')
  const taRef = useRef(null)

  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    const max = LINE_HEIGHT_PX * MAX_ROWS + 16
    el.style.height = Math.min(el.scrollHeight, max) + 'px'
  }, [value])

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || loading) return
    onSubmit(trimmed)
    setValue('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-gray-100 bg-gradient-to-b from-white to-brand-50/30 px-3 pt-3 pb-4">
      <div
        className="rounded-2xl border border-gray-200 bg-white shadow-card
                   focus-within:border-brand-400 focus-within:shadow-card-hover
                   focus-within:ring-4 focus-within:ring-brand-100/60
                   transition-all px-3 pt-2.5 pb-2"
      >
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about seaweed data…"
          className="w-full resize-none bg-transparent text-sm text-gray-900
                     placeholder:text-gray-400 focus:outline-none leading-5"
          style={{ minHeight: `${LINE_HEIGHT_PX}px` }}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            Enter to send · Shift+Enter for newline
          </span>
          {loading ? (
            <button
              type="button"
              aria-label="Stop"
              onClick={onStop}
              className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700
                         inline-flex items-center justify-center transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <rect x="6" y="6" width="12" height="12" rx="1.5" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              aria-label="Send"
              onClick={submit}
              disabled={!value.trim()}
              className="w-8 h-8 rounded-lg bg-brand-600 hover:bg-brand-700 text-white
                         disabled:bg-gray-100 disabled:text-gray-300
                         inline-flex items-center justify-center transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-gray-400">
        PSIA AI can make mistakes — verify important data.
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/chat/ChatInput.test.jsx`
Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/ChatInput.jsx src/components/chat/ChatInput.test.jsx
git commit -m "feat(chat): redesign ChatInput as auto-resizing composer pill"
```

---

## Task 7: AssistantMessage with streaming reveal

The bubble-less assistant message: avatar + label + markdown body + hover actions + SQL toggle + table, plus the fake-streaming character reveal.

**Files:**
- Create: `src/components/chat/AssistantMessage.jsx`
- Create: `src/components/chat/AssistantMessage.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/chat/AssistantMessage.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AssistantMessage from './AssistantMessage'

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
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/chat/AssistantMessage.test.jsx`
Expected: FAIL — cannot resolve `./AssistantMessage`.

- [ ] **Step 3: Implement AssistantMessage**

Create `src/components/chat/AssistantMessage.jsx`:

```jsx
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import SparkAvatar from './SparkAvatar'
import TypingDots from './TypingDots'
import ResultTable from './ResultTable'

const CHARS_PER_TICK = 3
const TICK_MS = 18

const MD_COMPONENTS = {
  p: props => <p className="my-2" {...props} />,
  ul: props => <ul className="my-2 list-disc pl-5 space-y-1" {...props} />,
  ol: props => <ol className="my-2 list-decimal pl-5 space-y-1" {...props} />,
  li: props => <li className="leading-relaxed" {...props} />,
  strong: props => <strong className="font-semibold text-gray-900" {...props} />,
  h1: props => <h2 className="mt-3 mb-1 text-base font-semibold text-gray-900" {...props} />,
  h2: props => <h3 className="mt-3 mb-1 text-sm font-semibold text-gray-900" {...props} />,
  code: ({ inline, children, ...props }) =>
    inline
      ? <code className="bg-gray-100 text-gray-800 rounded px-1 py-0.5 text-[0.85em] font-mono" {...props}>{children}</code>
      : <code className="block bg-gray-900 text-gray-100 rounded-lg p-3 text-xs font-mono overflow-x-auto" {...props}>{children}</code>,
  pre: props => <pre className="my-2" {...props} />,
}

export default function AssistantMessage({
  content,
  targetContent,
  sql,
  data,
  type,
  streaming = false,
  onRegenerate,
}) {
  const final = targetContent ?? content ?? ''
  const [revealed, setRevealed] = useState(streaming && targetContent ? '' : final)
  const [done, setDone] = useState(!streaming || !targetContent)
  const [sqlOpen, setSqlOpen] = useState(false)
  const [copyState, setCopyState] = useState('idle')
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!streaming || !targetContent) {
      setRevealed(final)
      setDone(true)
      return
    }
    setRevealed('')
    setDone(false)
    let i = 0
    intervalRef.current = setInterval(() => {
      i = Math.min(i + CHARS_PER_TICK, targetContent.length)
      setRevealed(targetContent.slice(0, i))
      if (i >= targetContent.length) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        setDone(true)
      }
    }, TICK_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [streaming, targetContent, final])

  useEffect(() => {
    if (!streaming || done) return
    function skip() {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setRevealed(targetContent ?? final)
      setDone(true)
    }
    document.addEventListener('mousedown', skip, { once: true })
    return () => document.removeEventListener('mousedown', skip)
  }, [streaming, done, targetContent, final])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(final)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1500)
    } catch {}
  }

  const showTyping = streaming && revealed.length === 0
  const showActions = done && revealed.length > 0

  return (
    <div className="group animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <SparkAvatar size={20} />
        <span className="text-xs font-medium text-gray-500">PSIA AI</span>
      </div>

      <div data-testid="assistant-body" className="text-sm text-gray-800 leading-relaxed">
        {showTyping ? (
          <TypingDots />
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
            {revealed}
          </ReactMarkdown>
        )}
      </div>

      {done && type === 'table' && data?.length > 0 && (
        <div className="mt-2 rounded-xl border border-gray-200 bg-white shadow-card p-2">
          <ResultTable data={data} />
        </div>
      )}

      {done && sql && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setSqlOpen(o => !o)}
            className="inline-flex items-center gap-1 text-xs text-brand-700 hover:bg-brand-50 px-2 py-1 rounded-md"
          >
            <span
              className="inline-block transition-transform"
              style={{ transform: sqlOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >▶</span>
            {sqlOpen ? 'Hide SQL' : 'View SQL'}
          </button>
          {sqlOpen && (
            <pre className="mt-1 p-2 bg-gray-900 text-gray-100 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {sql}
            </pre>
          )}
        </div>
      )}

      {showActions && (
        <div className="mt-1 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs text-gray-400 hover:text-brand-600 inline-flex items-center gap-1"
          >
            {copyState === 'copied' ? 'Copied ✓' : 'Copy'}
          </button>
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="text-xs text-gray-400 hover:text-brand-600 inline-flex items-center gap-1"
            >
              Regenerate
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/chat/AssistantMessage.test.jsx`
Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/AssistantMessage.jsx src/components/chat/AssistantMessage.test.jsx
git commit -m "feat(chat): add AssistantMessage with markdown, streaming reveal, hover actions"
```

---

## Task 8: MessageBubble router rewrite

`MessageBubble` becomes a thin router: user → inline teal pill, assistant → `AssistantMessage`, error → inline red notice.

**Files:**
- Modify: `src/components/chat/MessageBubble.jsx` (full rewrite)

- [ ] **Step 1: Rewrite MessageBubble**

Replace the entire contents of `src/components/chat/MessageBubble.jsx` with:

```jsx
import AssistantMessage from './AssistantMessage'

export default function MessageBubble({
  role,
  content,
  targetContent,
  sql,
  data,
  type,
  streaming,
  onRegenerate,
}) {
  if (role === 'user') {
    return (
      <div className="flex justify-end animate-fade-in">
        <div
          className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm
                     text-white bg-gradient-to-b from-brand-600 to-brand-700 shadow-card
                     whitespace-pre-wrap break-words"
        >
          {content}
        </div>
      </div>
    )
  }

  if (type === 'error') {
    return (
      <div
        className="animate-fade-in rounded-lg border border-rose-200 bg-rose-50
                   text-rose-800 text-sm px-3 py-2"
      >
        {content}
      </div>
    )
  }

  return (
    <AssistantMessage
      content={content}
      targetContent={targetContent}
      sql={sql}
      data={data}
      type={type}
      streaming={streaming}
      onRegenerate={onRegenerate}
    />
  )
}
```

- [ ] **Step 2: Verify no test regressions**

Run: `npx vitest run`
Expected: all previously passing tests still pass. (No new test for MessageBubble — it is now a thin router whose branches are covered by `AssistantMessage.test.jsx` and the smoke test in Task 11.)

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/MessageBubble.jsx
git commit -m "refactor(chat): MessageBubble routes to user pill, AssistantMessage, or error notice"
```

---

## Task 9: MessageThread with EmptyState

Render `EmptyState` when there are no messages; otherwise render the message list. Remove the old separate loading bubble — the typing dots live inside the assistant message slot now.

**Files:**
- Modify: `src/components/chat/MessageThread.jsx`

- [ ] **Step 1: Rewrite MessageThread**

Replace the entire contents of `src/components/chat/MessageThread.jsx` with:

```jsx
import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import EmptyState from './EmptyState'

export default function MessageThread({
  messages,
  onSuggestion,
  onRegenerate,
}) {
  const bottomRef = useRef(null)

  useEffect(() => {
    if (bottomRef.current?.scrollIntoView) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <EmptyState onSubmit={onSuggestion} />
      </div>
    )
  }

  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].type !== 'error') return i
    }
    return -1
  })()

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
      {messages.map((msg, i) => (
        <MessageBubble
          key={i}
          role={msg.role}
          content={msg.content}
          targetContent={msg.targetContent}
          sql={msg.sql}
          data={msg.data}
          type={msg.type}
          streaming={!!msg.streaming}
          onRegenerate={i === lastAssistantIdx ? onRegenerate : undefined}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
```

- [ ] **Step 2: Verify no regressions**

Run: `npx vitest run`
Expected: all tests still pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/MessageThread.jsx
git commit -m "refactor(chat): MessageThread renders EmptyState and wires onSuggestion / onRegenerate"
```

---

## Task 10: ChatPanel — new chrome, streaming wiring, abort, regenerate

Now wire everything together. ChatPanel gets:
- The new `ChatHeader`.
- The gradient panel background.
- `AbortController` on fetch.
- Assistant messages pushed with `streaming: true` + `targetContent` for the reveal animation.
- A `handleRegenerate` that drops the last assistant message and re-submits the previous user message.
- An `onStop` handler that aborts the fetch and cancels in-flight reveal.

**Files:**
- Modify: `src/components/chat/ChatPanel.jsx` (full rewrite)

- [ ] **Step 1: Rewrite ChatPanel**

Replace the entire contents of `src/components/chat/ChatPanel.jsx` with:

```jsx
import { useRef, useState } from 'react'
import ChatHeader from './ChatHeader'
import MessageThread from './MessageThread'
import ChatInput from './ChatInput'

const API_URL = 'http://localhost:8000/chat'

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef(null)

  async function sendMessage(question, replaceLastAssistant = false) {
    const baseHistory = replaceLastAssistant
      ? messages.slice(0, -1)
      : messages

    const userMsg = replaceLastAssistant
      ? null
      : { role: 'user', content: question, sql: null, data: [], type: null }

    const nextHistory = userMsg ? [...baseHistory, userMsg] : baseHistory
    setMessages(nextHistory)
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const history = nextHistory.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, history }),
        signal: controller.signal,
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

      const { answer, sql, data, type } = await resp.json()
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '',
          targetContent: answer,
          sql,
          data,
          type,
          streaming: true,
        },
      ])
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => prev)
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'Something went wrong. Is the backend running?',
            sql: null,
            data: [],
            type: 'error',
          },
        ])
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  function handleStop() {
    if (abortRef.current) abortRef.current.abort()
  }

  function handleRegenerate() {
    const lastUser = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUser) return
    sendMessage(lastUser.content, true)
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-brand-50/40 via-white to-white">
      <ChatHeader onClose={onClose} />
      <MessageThread
        messages={messages}
        onSuggestion={sendMessage}
        onRegenerate={handleRegenerate}
      />
      <ChatInput
        onSubmit={sendMessage}
        onStop={handleStop}
        loading={loading}
      />
    </div>
  )
}
```

- [ ] **Step 2: Run all tests to verify no regressions**

Run: `npx vitest run`
Expected: every test passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/ChatPanel.jsx
git commit -m "feat(chat): wire ChatPanel with header, streaming reveal, abort, regenerate"
```

---

## Task 11: Widen the panel in App.jsx

**Files:**
- Modify: `src/App.jsx:112` (change `w-80` → `w-96`)

- [ ] **Step 1: Update the width class**

In `src/App.jsx`, find the line:

```jsx
<div className="w-80 flex-shrink-0 flex flex-col h-screen sticky top-0">
```

Replace `w-80` with `w-96`:

```jsx
<div className="w-96 flex-shrink-0 flex flex-col h-screen sticky top-0">
```

- [ ] **Step 2: Commit**

```bash
git add src/App.jsx
git commit -m "feat(chat): widen ASK AI panel from 320px to 384px"
```

---

## Task 12: Smoke test + manual verification

End-to-end sanity check before declaring done.

**Files:** none modified.

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: every test passes, no warnings about `act()` or unhandled promises.

- [ ] **Step 2: Run the linter**

Run: `npm run lint`
Expected: clean exit (no errors). If new files fail lint, fix the warnings and re-run.

- [ ] **Step 3: Boot the dev server and click through it**

In one terminal: `cd backend && uvicorn main:app --reload`
In another: `npm run dev`

Open http://localhost:5173, open the ASK AI panel, and walk through this checklist:

  - Panel opens at the wider width (384px) with a soft teal-tinted background.
  - Header shows the teal sparkle avatar, "PSIA AI", and "Ask your data" subtitle.
  - Empty state renders the greeting + four suggestion chips.
  - Click a chip → the chip prompt becomes a teal user bubble; typing dots appear under a small sparkle + "PSIA AI" label.
  - Once the response arrives, it streams character-by-character.
  - Clicking inside the panel during streaming snaps to the full answer.
  - Hover the assistant message → "Copy" and "Regenerate" fade in. Clicking "Copy" flashes "Copied ✓"; clicking "Regenerate" replaces the last assistant message with a new run.
  - Click "View SQL" → the chevron rotates and the SQL block expands beneath; clicking again collapses it.
  - Submit a query that returns tabular data → result table renders inside a soft card.
  - Stop the backend, submit a query → red inline notice (no avatar) saying "Something went wrong…".
  - Submit a long question (multi-line) → composer textarea grows up to 6 rows then scrolls.
  - Click the composer Stop button while a response is loading → fetch aborts; no error notice appears (silent cancel).

- [ ] **Step 4: Final commit (if any lint fixes landed)**

```bash
git status
# If there are leftover lint-fix changes, commit them:
git add -A && git commit -m "chore(chat): lint fixes for ASK AI redesign"
```

If nothing changed in step 4, skip the commit.

---

## Done

The ASK AI panel now matches the spec at [docs/superpowers/specs/2026-05-19-ask-ai-redesign-design.md](../specs/2026-05-19-ask-ai-redesign-design.md): branded chrome, empty state with suggestions, bubble-less markdown assistant replies with hover actions, polished composer with auto-resize and stop, fake-streaming character reveal, and theme-teal accents throughout. Backend untouched.
