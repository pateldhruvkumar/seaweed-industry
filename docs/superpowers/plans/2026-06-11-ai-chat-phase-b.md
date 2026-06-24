# AI Chat Phase B — Edit & Resend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user edit any of their previous chat messages and re-run the conversation from that point (everything after the edited message is discarded — branch-by-discard).

**Architecture:** A new `UserMessage` component owns the user bubble plus an inline editor (hover **Edit** → textarea with Save & resend / Cancel). `ChatPanel` gains `editMessage(index, newText)`, implemented by extracting the existing fetch flow into a shared `runQuery(question, nextHistory)` core that `sendMessage`, `handleRegenerate`, and `editMessage` all reuse. `onEdit` is threaded `ChatPanel → MessageThread → MessageBubble → UserMessage`, gated to user-role messages.

**Tech Stack:** React 18, Vitest + React Testing Library. Frontend only — no backend changes.

**Spec:** `docs/superpowers/specs/2026-06-10-ai-chat-enhancements-design.md` (Phase B section)

**Branch:** `feature/chat-edit-resend`, stacked on `feature/ai-chat-enhancements` (Phase A touched the same files; PR #6 not yet merged).

**Design decisions (locked):**
- Any user message is editable, not just the last one.
- **Save always resends** (even if the text is unchanged) — Save is an explicit two-click action whose meaning is "re-run from here". Save is disabled when the draft is empty.
- Editor keyboard shortcuts match `ChatInput`: Enter = save, Shift+Enter = newline, Escape = cancel.
- Editing while a response is in-flight is allowed; `runQuery` aborts the in-flight request (same behavior as suggestion chips / regenerate).
- Truncation semantics: `editMessage(index, newText)` keeps `messages.slice(0, index)`, then appends a fresh user message with `newText` — i.e. the edited message is replaced in place and everything after it is discarded.

---

## File Structure

- Create `src/components/chat/UserMessage.jsx` — user bubble + inline editor (own state: `editing`, `draft`).
- Create `src/components/chat/UserMessage.test.jsx` — unit tests for the editor interactions.
- Modify `src/components/chat/MessageBubble.jsx:16-28` — user branch delegates to `<UserMessage>`; accept/forward `onEdit`.
- Modify `src/components/chat/MessageThread.jsx` — accept `onEdit`; pass `text => onEdit(i, text)` to user-role bubbles.
- Modify `src/components/chat/ChatPanel.jsx:19-92` — extract `runQuery`, add `makeUserMsg` + `editMessage`, pass `onEdit` to the thread.
- Create `src/components/chat/ChatPanel.test.jsx` — integration test (mocked `fetch`) proving truncation + resend.

---

## Task 0: Branch setup

- [ ] **Step 1: Create the stacked branch**

```bash
cd D:/github/seaweed-industry
git checkout feature/ai-chat-enhancements
git checkout -b feature/chat-edit-resend
```

Expected: `Switched to a new branch 'feature/chat-edit-resend'`. Do NOT touch the user's uncommitted changes in unrelated files (`src/tabs/*`, `src/components/AboutDataPanel.jsx`, `src/data/sources.js`, `.claude/settings.local.json`).

---

## Task 1: `UserMessage` component

**Files:**
- Create: `src/components/chat/UserMessage.jsx`
- Test: `src/components/chat/UserMessage.test.jsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/chat/UserMessage.test.jsx`:

```jsx
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
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/chat/UserMessage.test.jsx`
Expected: FAIL — `Failed to resolve import "./UserMessage"`.

- [ ] **Step 3: Implement `UserMessage`**

Create `src/components/chat/UserMessage.jsx` (bubble styling copied from the current user branch of `MessageBubble.jsx`; hover-action pattern mirrors `AssistantMessage`'s `group`/`group-hover` actions):

```jsx
import { useState } from 'react'

export default function UserMessage({ content, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)

  function startEdit() {
    setDraft(content)
    setEditing(true)
  }

  function cancel() {
    setDraft(content)
    setEditing(false)
  }

  function save() {
    const trimmed = draft.trim()
    if (!trimmed) return
    setEditing(false)
    onEdit(trimmed)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      save()
    }
    if (e.key === 'Escape') cancel()
  }

  if (editing) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="w-[85%] rounded-2xl border border-brand-300 bg-white shadow-card p-2">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={Math.min(6, Math.max(2, draft.split('\n').length))}
            autoFocus
            className="w-full resize-none bg-transparent text-sm text-gray-900
                       focus:outline-none leading-5 p-1"
          />
          <div className="mt-1 flex items-center justify-end gap-2">
            <span className="mr-auto text-[11px] text-gray-400">
              Enter to resend · Esc to cancel
            </span>
            <button
              type="button"
              onClick={cancel}
              className="text-xs px-3 py-1 rounded-md text-gray-500 hover:bg-gray-100
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!draft.trim()}
              className="text-xs px-3 py-1 rounded-md bg-brand-600 text-white hover:bg-brand-700
                         disabled:bg-gray-200 disabled:text-gray-400
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Save & resend
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex flex-col items-end animate-fade-in">
      <div
        className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm
                   text-white bg-gradient-to-b from-brand-600 to-brand-700 shadow-card
                   whitespace-pre-wrap break-words"
      >
        {content}
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={startEdit}
          className="mt-1 text-xs text-gray-400 hover:text-brand-600
                     opacity-0 group-hover:opacity-100 focus-visible:opacity-100
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
                     rounded transition-opacity"
        >
          Edit
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/components/chat/UserMessage.test.jsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/UserMessage.jsx src/components/chat/UserMessage.test.jsx
git commit -m "feat(chat): add UserMessage bubble with inline edit affordance"
```

---

## Task 2: Wire edit & resend through ChatPanel

**Files:**
- Modify: `src/components/chat/ChatPanel.jsx:19-92`
- Modify: `src/components/chat/MessageBubble.jsx:16-28`
- Modify: `src/components/chat/MessageThread.jsx:5-9` and the `<MessageBubble>` props
- Test: `src/components/chat/ChatPanel.test.jsx` (new)

- [ ] **Step 1: Write the failing integration test**

Create `src/components/chat/ChatPanel.test.jsx`:

```jsx
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

    // Edit the SECOND user message (index 2 in the thread)
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
```

Notes for the implementer: the assistant typewriter reveals ~3 chars per 18 ms, so short answers like `first answer` finish well inside `findByText`'s default 1 s timeout — use real timers (do NOT enable fake timers in this file). `MessageThread` guards `scrollIntoView` so jsdom is fine.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/components/chat/ChatPanel.test.jsx`
Expected: FAIL — no Edit buttons found (`getAllByRole` returns no matches), because `MessageBubble` doesn't render `UserMessage` yet.

- [ ] **Step 3: Refactor `ChatPanel.jsx`**

Replace the current `sendMessage` (lines 19–82) with a shared core + three thin callers. The fetch/streaming/error logic moves verbatim into `runQuery`; behavior of existing paths must not change (the API request still includes the new user message in `history` — preserve that quirk exactly):

```jsx
  function makeUserMsg(text) {
    return { role: 'user', content: text, sql: null, data: [], type: null }
  }

  async function runQuery(question, nextHistory) {
    setMessages(nextHistory)
    setLoading(true)

    if (abortRef.current) abortRef.current.abort()
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

      const { answer, sql, data, type, chart, suggestions } = await resp.json()
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '',
          targetContent: answer,
          sql,
          data,
          type,
          chart,
          suggestions,
          streaming: true,
        },
      ])
    } catch (err) {
      if (err.name !== 'AbortError') {
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

  function sendMessage(question, replaceLastAssistant = false) {
    const baseHistory = replaceLastAssistant
      ? messages.slice(0, -1)
      : messages
    const nextHistory = replaceLastAssistant
      ? baseHistory
      : [...baseHistory, makeUserMsg(question)]
    return runQuery(question, nextHistory)
  }

  function editMessage(index, newText) {
    const nextHistory = [...messages.slice(0, index), makeUserMsg(newText)]
    return runQuery(newText, nextHistory)
  }
```

`handleStop` and `handleRegenerate` stay as they are. In the JSX, pass the new handler to the thread:

```jsx
      <MessageThread
        messages={messages}
        onSuggestion={sendMessage}
        onRegenerate={handleRegenerate}
        onEdit={editMessage}
      />
```

- [ ] **Step 4: Thread `onEdit` and render `UserMessage`**

In `src/components/chat/MessageThread.jsx`, add `onEdit` to the props and pass a per-index callback to user-role bubbles only:

```jsx
export default function MessageThread({
  messages,
  onSuggestion,
  onRegenerate,
  onEdit,
}) {
```

and inside `messages.map(...)`, add to `<MessageBubble>`:

```jsx
          onEdit={msg.role === 'user' && onEdit ? text => onEdit(i, text) : undefined}
```

In `src/components/chat/MessageBubble.jsx`, import `UserMessage`, accept `onEdit`, and replace the inline user-bubble JSX (the `if (role === 'user')` block) with:

```jsx
import UserMessage from './UserMessage'
```

```jsx
  if (role === 'user') {
    return <UserMessage content={content} onEdit={onEdit} />
  }
```

(`onEdit` is added to the destructured props; the assistant/error branches are unchanged.)

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/components/chat/ChatPanel.test.jsx`
Expected: PASS (2 tests).

Then the full chat suite (the refactor must not break Phase A behavior):
Run: `npx vitest run src/components/chat`
Expected: ALL pass (UserMessage 7 + ChatPanel 2 + the pre-existing 56 = 65).

- [ ] **Step 6: Commit**

```bash
git add src/components/chat/ChatPanel.jsx src/components/chat/ChatPanel.test.jsx src/components/chat/MessageBubble.jsx src/components/chat/MessageThread.jsx
git commit -m "feat(chat): edit & resend - branch the conversation from an edited message"
```

---

## Task 3: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Full frontend suite**

Run: `npm test`
Expected: ALL pass (~100 tests across ~19 files: 93 pre-existing + 9 new).

- [ ] **Step 2: Lint touched files**

Run: `npx eslint src/components/chat/UserMessage.jsx src/components/chat/UserMessage.test.jsx src/components/chat/ChatPanel.jsx src/components/chat/ChatPanel.test.jsx src/components/chat/MessageBubble.jsx src/components/chat/MessageThread.jsx`
Expected: no output (clean). (~15 pre-existing eslint errors exist in unrelated files — ignore.)

- [ ] **Step 3: Live smoke test (backend + dev server)**

Start the backend (`python -m uvicorn main:app --port 8000` from `backend/`; needs `GROQ_API_KEY` in `backend/.env`, takes ~60 s to load the embedding model) and the frontend (preview `dev` config, port 5173). Then:
- Ask two questions.
- Hover the first user bubble → Edit appears; click it, change the text, Save & resend.
- Verify: the thread truncates to just the edited question + its new answer; the chart/chips still render on the new answer; no console errors.
- Stop both servers afterwards.

---

## Self-Review Notes

- **Spec coverage:** hover Edit affordance + inline textarea with Save/Cancel → Task 1; `editMessage(index, newText)` truncate-and-rerun in ChatPanel → Task 2; threading index + onEdit through MessageThread → MessageBubble → Task 2; "editing truncates then sends newText" and "Cancel restores without sending" tests → Tasks 1–2.
- **Type consistency:** `onEdit(i, text)` at the ChatPanel/MessageThread boundary; `onEdit(text)` at the MessageBubble/UserMessage boundary (index already bound). `editMessage(index, newText)` matches the spec name.
- **Phase A regression safety:** `runQuery` is a verbatim extraction of the existing fetch block; the full chat suite re-runs in Task 2 Step 5.
- **YAGNI check:** no message ids, no undo/branch history, no multi-branch UI — branch-by-discard only, per spec.
