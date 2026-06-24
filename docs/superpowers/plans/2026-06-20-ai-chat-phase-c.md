# AI Chat Phase C — Saved Threads (localStorage) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist chat conversations in the browser so a user can reopen the app to their last conversation, browse past chats from a history panel, switch between them, start a new chat, and delete chats — all client-side, no backend changes.

**Architecture:** A new pure module `src/lib/threadStore.js` does CRUD over a single `localStorage` key (`psia.threads`), normalizing each message to its display fields and folding the typewriter's `targetContent` into `content` so reloaded answers render statically. `ChatPanel` gains thread state: it loads the most-recent thread on mount, debounce-saves whenever `messages` changes, and exposes new-chat / select / delete handlers. A new presentational `ThreadHistory` slide-over (rendered by `ChatPanel` as a full-panel overlay) lists saved chats; `ChatHeader` gets a history button that opens it. Every storage read/write is wrapped in try/catch and degrades to an ephemeral session on failure.

**Tech Stack:** React 18, Vitest + React Testing Library, `localStorage` (jsdom in tests). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-10-ai-chat-enhancements-design.md` (Phase C section, lines 179–198).

**Design decisions (locked):**
- **The slide-over is rendered by `ChatPanel`, not `ChatHeader`.** It needs to cover the whole panel (`absolute inset-0`), so it lives at the panel root (which becomes `relative`). `ChatHeader` only owns the button and calls `onHistory`.
- **Message normalization on save.** The typewriter "done" state is local to `AssistantMessage` and never written back to `ChatPanel.messages`; a freshly streamed assistant message stays `{ content: '', targetContent: answer, streaming: true }`. The store therefore maps `targetContent ?? content → content` and drops `streaming`/`targetContent`, persisting only `role, content, sql, data, type, chart, suggestions`.
- **Debounced save (500 ms)** keyed off `messages` changes, using a ref for the active id so the effect doesn't re-fire when the id is assigned.
- **Caller-owned ids via the store.** `saveThread(id, messages)` reuses `id` if given/known, else mints one and returns it; `ChatPanel` captures the returned id into `activeId`.
- **Tests must clear `localStorage`** in `beforeEach`. The shared jsdom `localStorage` persists across tests in a file; without clearing, ChatPanel's new mount-load would bleed one test's thread into the next.

---

## File Map

| File | Purpose |
|------|---------|
| `src/lib/threadStore.js` | localStorage CRUD: `listThreads`, `getThread`, `saveThread`, `deleteThread`, `deriveTitle`; message normalization; try/catch hardening |
| `src/lib/threadStore.test.js` | Unit tests for the store (round-trips, title derivation, normalization, sort order, corrupt-JSON safety) |
| `src/lib/icons.jsx` | Add `IconHistory`, `IconPlus`, `IconTrash` to the existing inline-SVG set |
| `src/components/chat/ThreadHistory.jsx` | Full-panel slide-over: New-chat action, list of saved chats (title + relative time), per-row delete, close |
| `src/components/chat/ThreadHistory.test.jsx` | Component tests (renders list, select/delete/new callbacks, hidden when closed, empty state) |
| `src/components/chat/ChatHeader.jsx` | Add a history button (calls `onHistory`); switch close glyph to `IconX` |
| `src/components/chat/ChatHeader.test.jsx` | Add coverage for the history button presence + callback |
| `src/components/chat/ChatPanel.jsx` | Thread state + mount-load + debounce-save + new/select/delete handlers; render `ThreadHistory`; pass `onHistory` to header |
| `src/components/chat/ChatPanel.test.jsx` | Add `localStorage.clear()` per test + persistence/new-chat/select/delete tests |

---

## Task 1: threadStore module

**Files:**
- Create: `src/lib/threadStore.js`
- Test: `src/lib/threadStore.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/threadStore.test.js`:

```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  listThreads,
  getThread,
  saveThread,
  deleteThread,
  deriveTitle,
} from './threadStore'

beforeEach(() => localStorage.clear())

const userMsg = text => ({ role: 'user', content: text, sql: null, data: [], type: null })
const botMsg = target => ({
  role: 'assistant',
  content: '',
  targetContent: target,
  sql: 'SELECT 1',
  data: [{ a: 1 }],
  type: 'table',
  chart: null,
  suggestions: ['next?'],
  streaming: true,
})

describe('threadStore', () => {
  it('returns an empty list when nothing is stored', () => {
    expect(listThreads()).toEqual([])
  })

  it('returns an empty list (no throw) when the stored value is corrupt', () => {
    localStorage.setItem('psia.threads', '{not json')
    expect(listThreads()).toEqual([])
  })

  it('creates, gets, and lists a thread (round-trip)', () => {
    const saved = saveThread(null, [userMsg('hello')])
    expect(saved.id).toBeTruthy()
    expect(getThread(saved.id)).toMatchObject({ id: saved.id, title: 'hello' })
    expect(listThreads()).toHaveLength(1)
  })

  it('updates an existing thread in place (same id)', () => {
    const a = saveThread(null, [userMsg('hi')])
    const b = saveThread(a.id, [userMsg('hi'), botMsg('answer')])
    expect(b.id).toBe(a.id)
    expect(listThreads()).toHaveLength(1)
    expect(getThread(a.id).messages).toHaveLength(2)
  })

  it('normalizes assistant messages to done form (targetContent → content, no streaming)', () => {
    const saved = saveThread(null, [userMsg('q'), botMsg('the answer')])
    const bot = getThread(saved.id).messages[1]
    expect(bot.content).toBe('the answer')
    expect(bot).not.toHaveProperty('targetContent')
    expect(bot).not.toHaveProperty('streaming')
    expect(bot.suggestions).toEqual(['next?'])
  })

  it('derives the title from the first user message, truncated to 40 chars', () => {
    const long = 'a'.repeat(60)
    expect(deriveTitle([userMsg(long)])).toBe(`${'a'.repeat(40)}…`)
    expect(deriveTitle([botMsg('x'), userMsg('real question')])).toBe('real question')
    expect(deriveTitle([])).toBe('New chat')
  })

  it('lists threads newest-updated first', () => {
    const first = saveThread(null, [userMsg('first')])
    vi.spyOn(Date, 'now').mockReturnValue(first.updatedAt + 1000)
    const second = saveThread(null, [userMsg('second')])
    Date.now.mockRestore()
    expect(listThreads().map(t => t.id)).toEqual([second.id, first.id])
  })

  it('deletes a thread by id', () => {
    const a = saveThread(null, [userMsg('a')])
    const b = saveThread(null, [userMsg('b')])
    deleteThread(a.id)
    expect(listThreads().map(t => t.id)).toEqual([b.id])
  })
})
```

- [ ] **Step 2: Run the tests — confirm they fail**

Run: `npx vitest run src/lib/threadStore.test.js`
Expected: FAIL — cannot resolve `./threadStore` / exports not defined.

- [ ] **Step 3: Implement `src/lib/threadStore.js`**

```js
/**
 * Saved-thread persistence over localStorage. Phase C of the AI chat.
 *
 * Schema (localStorage key `psia.threads`):
 *   { id, title, createdAt, updatedAt, messages }[]
 *
 * Only the display fields of each message are persisted, and assistant messages
 * are stored already-"done": the typewriter's `targetContent` is folded into
 * `content` and the transient `streaming`/`targetContent` fields are dropped, so
 * a reloaded thread renders statically (see AssistantMessage).
 *
 * Every read/write is wrapped in try/catch: a corrupt value or a quota/denied
 * localStorage never throws into the UI — we degrade to an ephemeral session.
 */

const KEY = 'psia.threads'
const TITLE_MAX = 40

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function readAll() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(threads) {
  try {
    localStorage.setItem(KEY, JSON.stringify(threads))
  } catch {
    // Quota exceeded or storage unavailable — drop silently.
  }
}

function normalizeMessage(m) {
  return {
    role: m.role,
    content: m.targetContent ?? m.content ?? '',
    sql: m.sql ?? null,
    data: m.data ?? [],
    type: m.type ?? null,
    chart: m.chart ?? null,
    suggestions: m.suggestions ?? [],
  }
}

export function deriveTitle(messages) {
  const firstUser = (messages ?? []).find(m => m.role === 'user')
  const text = (firstUser?.content ?? '').trim()
  if (!text) return 'New chat'
  return text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX).trimEnd()}…` : text
}

export function listThreads() {
  return readAll().sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
}

export function getThread(id) {
  return readAll().find(t => t.id === id) ?? null
}

export function saveThread(id, messages) {
  const threads = readAll()
  const now = Date.now()
  const existing = id ? threads.find(t => t.id === id) : null
  const saved = {
    id: existing?.id ?? id ?? newId(),
    title: deriveTitle(messages),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    messages: (messages ?? []).map(normalizeMessage),
  }
  const next = existing
    ? threads.map(t => (t.id === saved.id ? saved : t))
    : [...threads, saved]
  writeAll(next)
  return saved
}

export function deleteThread(id) {
  writeAll(readAll().filter(t => t.id !== id))
}
```

- [ ] **Step 4: Run the tests — confirm they pass**

Run: `npx vitest run src/lib/threadStore.test.js`
Expected: 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/threadStore.js src/lib/threadStore.test.js
git commit -m "feat(chat): add threadStore localStorage persistence for saved chats"
```

---

## Task 2: ThreadHistory slide-over component

**Files:**
- Modify: `src/lib/icons.jsx` (add `IconHistory`, `IconPlus`, `IconTrash`)
- Create: `src/components/chat/ThreadHistory.jsx`
- Test: `src/components/chat/ThreadHistory.test.jsx`

- [ ] **Step 1: Add the three icons to `src/lib/icons.jsx`**

Insert these exports immediately **after** the existing `IconMenu` export (before `IconX`):

```jsx
export const IconHistory = props => (
  <Svg {...props}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </Svg>
)

export const IconPlus = props => (
  <Svg {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
)

export const IconTrash = props => (
  <Svg {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
)
```

- [ ] **Step 2: Write the failing tests**

Create `src/components/chat/ThreadHistory.test.jsx`:

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThreadHistory from './ThreadHistory'
import { saveThread } from '../../lib/threadStore'

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
    const titles = screen.getAllByText(/chat$/).map(el => el.textContent)
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
    const onDelete = vi.fn(id => deleteForTest(id))
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

// The component re-reads the store after delete, so the test's onDelete must
// actually remove the thread for the "refreshes the list" assertion to hold.
function deleteForTest(id) {
  // eslint-disable-next-line no-undef
  const raw = localStorage.getItem('psia.threads')
  const list = raw ? JSON.parse(raw) : []
  localStorage.setItem('psia.threads', JSON.stringify(list.filter(t => t.id !== id)))
}
```

- [ ] **Step 3: Run the tests — confirm they fail**

Run: `npx vitest run src/components/chat/ThreadHistory.test.jsx`
Expected: FAIL — cannot resolve `./ThreadHistory`.

- [ ] **Step 4: Implement `src/components/chat/ThreadHistory.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { listThreads } from '../../lib/threadStore'
import { IconPlus, IconTrash, IconX } from '../../lib/icons'

function relativeTime(ts) {
  const diff = Date.now() - (ts ?? 0)
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

export default function ThreadHistory({ open, activeId, onSelect, onDelete, onNewChat, onClose }) {
  const [threads, setThreads] = useState([])

  useEffect(() => {
    if (open) setThreads(listThreads())
  }, [open])

  if (!open) return null

  function handleDelete(e, id) {
    e.stopPropagation()
    onDelete(id)
    setThreads(listThreads())
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white/95 backdrop-blur animate-fade-in">
      <div className="flex items-center justify-between px-3 py-2.5 shadow-chrome">
        <span className="text-sm font-semibold text-gray-900">Saved chats</span>
        <button
          type="button"
          aria-label="Close history"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 w-6 h-6 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
        >
          <IconX className="w-4 h-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onNewChat}
        className="mx-3 mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
      >
        <IconPlus className="w-4 h-4" /> New chat
      </button>

      <ul className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {threads.length === 0 && (
          <li className="text-sm text-gray-400 px-1 py-4 text-center">No saved chats yet.</li>
        )}
        {threads.map(t => (
          <li key={t.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect(t.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') onSelect(t.id)
              }}
              className={`group flex items-center justify-between gap-2 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                t.id === activeId ? 'bg-brand-50 ring-1 ring-brand-200' : ''
              }`}
            >
              <div className="min-w-0">
                <div className="truncate text-sm text-gray-800">{t.title}</div>
                <div className="text-[11px] text-gray-400">{relativeTime(t.updatedAt)}</div>
              </div>
              <button
                type="button"
                aria-label={`Delete ${t.title}`}
                onClick={e => handleDelete(e, t.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 w-6 h-6 inline-flex items-center justify-center rounded-md hover:bg-gray-200"
              >
                <IconTrash className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 5: Run the tests — confirm they pass**

Run: `npx vitest run src/components/chat/ThreadHistory.test.jsx`
Expected: 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/icons.jsx src/components/chat/ThreadHistory.jsx src/components/chat/ThreadHistory.test.jsx
git commit -m "feat(chat): add ThreadHistory slide-over with saved-chat list"
```

---

## Task 3: ChatHeader history button

**Files:**
- Modify: `src/components/chat/ChatHeader.jsx`
- Test: `src/components/chat/ChatHeader.test.jsx`

- [ ] **Step 1: Add the failing tests**

Add these two `it` blocks inside the existing `describe('ChatHeader', ...)` in `src/components/chat/ChatHeader.test.jsx`:

```jsx
  it('calls onHistory when the history button is clicked', async () => {
    const onHistory = vi.fn()
    render(<ChatHeader onClose={() => {}} onHistory={onHistory} />)
    await userEvent.click(screen.getByRole('button', { name: /history/i }))
    expect(onHistory).toHaveBeenCalledOnce()
  })

  it('omits the history button when onHistory is not provided', () => {
    render(<ChatHeader onClose={() => {}} />)
    expect(screen.queryByRole('button', { name: /history/i })).toBeNull()
  })
```

- [ ] **Step 2: Run the tests — confirm the new ones fail**

Run: `npx vitest run src/components/chat/ChatHeader.test.jsx`
Expected: the two new tests FAIL (no history button); the two original tests PASS.

- [ ] **Step 3: Replace `src/components/chat/ChatHeader.jsx`**

```jsx
import SparkAvatar from './SparkAvatar'
import { IconHistory, IconX } from '../../lib/icons'

export default function ChatHeader({ onClose, onHistory }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-white/60 backdrop-blur shadow-chrome">
      <div className="flex items-center gap-2">
        <SparkAvatar size={24} />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-gray-900">PSIA AI</span>
          <span className="text-[11px] text-brand-700">Ask your data</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onHistory && (
          <button
            type="button"
            aria-label="Chat history"
            onClick={onHistory}
            className="text-gray-400 hover:text-gray-600 w-7 h-7 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
          >
            <IconHistory className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 w-7 h-7 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
        >
          <IconX className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the tests — confirm all pass**

Run: `npx vitest run src/components/chat/ChatHeader.test.jsx`
Expected: 4 tests PASS. (The original close test still matches `name: /close/i` via the `aria-label="Close"`.)

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/ChatHeader.jsx src/components/chat/ChatHeader.test.jsx
git commit -m "feat(chat): add history button to ChatHeader"
```

---

## Task 4: Wire persistence into ChatPanel

**Files:**
- Modify: `src/components/chat/ChatPanel.test.jsx` (add `localStorage` cleanup + persistence tests)
- Modify: `src/components/chat/ChatPanel.jsx`

- [ ] **Step 1: Update imports and add `localStorage` cleanup in `ChatPanel.test.jsx`**

Replace the top of the file (lines 1–4, the imports) with:

```jsx
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatPanel from './ChatPanel'
import { listThreads, saveThread } from '../../lib/threadStore'
```

Then add a `beforeEach` next to the existing `afterEach` (after the `deferred()` helper, around line 27):

```jsx
beforeEach(() => localStorage.clear())
```

- [ ] **Step 2: Add the failing persistence tests**

Append this `describe` block to the end of `src/components/chat/ChatPanel.test.jsx`:

```jsx
describe('ChatPanel saved threads', () => {
  it('persists a conversation and reloads it on remount', async () => {
    const fetchMock = vi.fn().mockReturnValue(mockFetchResponse('persisted answer'))
    vi.stubGlobal('fetch', fetchMock)

    const { unmount } = render(<ChatPanel onClose={() => {}} />)
    await userEvent.type(screen.getByPlaceholderText(/ask anything/i), 'remember me{Enter}')
    await screen.findByText('persisted answer')

    await waitFor(() => expect(listThreads()).toHaveLength(1))
    expect(listThreads()[0].title).toBe('remember me')

    unmount()
    render(<ChatPanel onClose={() => {}} />)
    expect(await screen.findByText('remember me')).toBeInTheDocument()
  })

  it('"New chat" clears the view but keeps the saved thread', async () => {
    const fetchMock = vi.fn().mockReturnValue(mockFetchResponse('answer one'))
    vi.stubGlobal('fetch', fetchMock)

    render(<ChatPanel onClose={() => {}} />)
    await userEvent.type(screen.getByPlaceholderText(/ask anything/i), 'first thread{Enter}')
    await screen.findByText('answer one')
    await waitFor(() => expect(listThreads()).toHaveLength(1))

    await userEvent.click(screen.getByRole('button', { name: /history/i }))
    await userEvent.click(screen.getByRole('button', { name: /new chat/i }))

    expect(screen.queryByText('first thread')).toBeNull()
    expect(listThreads()).toHaveLength(1)
  })

  it('loads a saved thread from the history list', async () => {
    const older = saveThread(null, [{ role: 'user', content: 'older chat', sql: null, data: [], type: null }])
    vi.spyOn(Date, 'now').mockReturnValue(older.updatedAt + 1000)
    saveThread(null, [{ role: 'user', content: 'newer chat', sql: null, data: [], type: null }])
    Date.now.mockRestore()

    render(<ChatPanel onClose={() => {}} />)
    expect(await screen.findByText('newer chat')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /history/i }))
    await userEvent.click(screen.getByText('older chat'))

    expect(await screen.findByText('older chat')).toBeInTheDocument()
  })

  it('deleting the active thread from history clears the view', async () => {
    saveThread(null, [{ role: 'user', content: 'doomed chat', sql: null, data: [], type: null }])

    render(<ChatPanel onClose={() => {}} />)
    expect(await screen.findByText('doomed chat')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /history/i }))
    await userEvent.click(screen.getByRole('button', { name: /delete doomed chat/i }))

    expect(screen.queryByText('doomed chat')).toBeNull()
    expect(listThreads()).toHaveLength(0)
  })
})
```

- [ ] **Step 3: Run the tests — confirm the new ones fail**

Run: `npx vitest run src/components/chat/ChatPanel.test.jsx`
Expected: the four new tests FAIL (no history button, nothing persisted); the existing tests still PASS.

- [ ] **Step 4: Replace `src/components/chat/ChatPanel.jsx`**

```jsx
import { useEffect, useRef, useState } from 'react'
import ChatHeader from './ChatHeader'
import MessageThread from './MessageThread'
import ChatInput from './ChatInput'
import ThreadHistory from './ThreadHistory'
import { listThreads, getThread, saveThread, deleteThread } from '../../lib/threadStore'

const API_URL = 'http://localhost:8000/chat'
const SAVE_DEBOUNCE_MS = 500

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const abortRef = useRef(null)
  // Holds the active thread id for the save effect without making it a dep
  // (assigning the id mid-save must not re-trigger the effect).
  const activeIdRef = useRef(null)

  // Load the most-recently-updated saved thread on mount (or start empty).
  useEffect(() => {
    const threads = listThreads()
    if (threads.length > 0) {
      setMessages(threads[0].messages)
      setActiveId(threads[0].id)
      activeIdRef.current = threads[0].id
    }
  }, [])

  // Debounce-persist the active thread whenever the conversation changes.
  useEffect(() => {
    if (messages.length === 0) return
    const handle = setTimeout(() => {
      const saved = saveThread(activeIdRef.current, messages)
      if (saved.id !== activeIdRef.current) {
        activeIdRef.current = saved.id
        setActiveId(saved.id)
      }
    }, SAVE_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [messages])

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

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
      if (controller.signal.aborted) return
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
      if (err.name !== 'AbortError' && !controller.signal.aborted) {
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
      // Only the request that still owns abortRef may clear the shared state;
      // an aborted predecessor must not clobber its successor's loading/stop.
      if (abortRef.current === controller) {
        setLoading(false)
        abortRef.current = null
      }
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

  function handleStop() {
    if (abortRef.current) abortRef.current.abort()
  }

  function handleRegenerate() {
    const lastUser = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUser) return
    sendMessage(lastUser.content, true)
  }

  function handleNewChat() {
    if (abortRef.current) abortRef.current.abort()
    setMessages([])
    setActiveId(null)
    activeIdRef.current = null
    setHistoryOpen(false)
  }

  function handleSelectThread(id) {
    if (abortRef.current) abortRef.current.abort()
    const thread = getThread(id)
    if (!thread) return
    setMessages(thread.messages)
    setActiveId(id)
    activeIdRef.current = id
    setHistoryOpen(false)
  }

  function handleDeleteThread(id) {
    deleteThread(id)
    if (id === activeIdRef.current) {
      setMessages([])
      setActiveId(null)
      activeIdRef.current = null
    }
  }

  return (
    <div className="relative flex flex-col h-full bg-gradient-to-b from-brand-50/40 via-white to-white">
      <ChatHeader onClose={onClose} onHistory={() => setHistoryOpen(true)} />
      <MessageThread
        messages={messages}
        loading={loading}
        onSuggestion={sendMessage}
        onRegenerate={handleRegenerate}
        onEdit={editMessage}
      />
      <ChatInput
        onSubmit={sendMessage}
        onStop={handleStop}
        loading={loading}
      />
      <ThreadHistory
        open={historyOpen}
        activeId={activeId}
        onSelect={handleSelectThread}
        onDelete={handleDeleteThread}
        onNewChat={handleNewChat}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  )
}
```

- [ ] **Step 5: Run the tests — confirm all pass**

Run: `npx vitest run src/components/chat/ChatPanel.test.jsx`
Expected: all tests PASS (5 original + 4 new = 9).

- [ ] **Step 6: Commit**

```bash
git add src/components/chat/ChatPanel.jsx src/components/chat/ChatPanel.test.jsx
git commit -m "feat(chat): persist, reload, switch, and delete saved chat threads"
```

---

## Task 5: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full frontend test suite**

Run: `npm test`
Expected: all suites PASS, including the pre-existing chat/dashboard tests. No unhandled-rejection or act() warnings introduced by the new code.

- [ ] **Step 2: Lint the touched files**

Run: `npx eslint src/lib/threadStore.js src/lib/icons.jsx src/components/chat/ThreadHistory.jsx src/components/chat/ChatHeader.jsx src/components/chat/ChatPanel.jsx`
Expected: no errors in these files. (Ignore unrelated pre-existing eslint errors elsewhere in the repo.)

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: Vite build completes with no errors.

- [ ] **Step 4: Manual smoke test (browser)**

Start the dev server (`npm run dev`) and the backend, then in the chat panel:
1. Ask a question, get an answer.
2. Reload the page → the conversation is restored.
3. Click the history (clock) icon → the slide-over lists the chat with a relative timestamp.
4. Click **New chat** → the view clears; the old chat remains in history.
5. Open history, click the old chat → it loads back.
6. Open history, delete the active chat → the view clears and it disappears from the list.

Expected: all six behaviors work; no console errors.

- [ ] **Step 5: Final commit (if any cleanup was needed)**

```bash
git add -A
git commit -m "chore(chat): Phase C verification cleanup"
```

(Skip if Steps 1–3 required no changes.)

---

## Self-Review

**Spec coverage** (`...enhancements-design.md` lines 179–198):
- `threadStore.js` with localStorage CRUD, `psia.threads` key, schema `{id,title,createdAt,updatedAt,messages}` → Task 1. ✅
- Title auto-derived from first user message (~40 chars) → `deriveTitle`, Task 1. ✅
- Persist only display fields; store messages already-`done` (no `streaming`/`targetContent`) → `normalizeMessage`, Task 1. ✅
- All reads/writes try/catch; corrupt/quota → empty, never throw → `readAll`/`writeAll`, Task 1. ✅
- ChatPanel: load most-recent on mount; debounce-save on `messages` change; New chat; switch threads → Task 4. ✅
- ChatHeader history icon → in-panel slide-over: titles + relative timestamps, click to load, per-thread delete, New chat at top → Tasks 2 + 3 (button in header, overlay rendered by ChatPanel). ✅
- Tests: store round-trips, title derivation, corrupt-JSON safety → Task 1. ✅

**Placeholder scan:** No TBD/TODO/"add error handling"/"similar to" — every code step contains complete code. ✅

**Type/name consistency:** Store exports `listThreads`, `getThread`, `saveThread(id, messages)`, `deleteThread(id)`, `deriveTitle(messages)` — referenced identically in `ThreadHistory.jsx`, `ChatPanel.jsx`, and all tests. `ThreadHistory` props `{ open, activeId, onSelect, onDelete, onNewChat, onClose }` match exactly what `ChatPanel` passes. `ChatHeader` prop `onHistory` matches. Icons `IconHistory`/`IconPlus`/`IconTrash` added in Task 2 before first use. ✅

**Cross-cutting (spec "Cross-cutting concerns"):** localStorage failure degrades to ephemeral session (try/catch); no new dependencies; API/CORS untouched (frontend-only). ✅
