# ASK AI — Claude-style Redesign

**Status:** Approved
**Date:** 2026-05-19
**Scope:** Frontend-only visual + interaction redesign of the existing `ChatPanel` and its children. No backend changes.

---

## 1. Goal

Make the ASK AI side panel look and feel like Claude's chat interface — branded with the PSIA teal palette — so it reads as a deliberate, polished product surface rather than a utility widget bolted onto the dashboard.

Keep the existing position (sticky right-side panel toggled from the topbar) and the existing fetch contract (`POST /chat` returning `{ answer, sql, data, type }`).

---

## 2. Non-goals

- Real server-sent-event streaming (faked client-side; backend untouched).
- Chat history persistence (localStorage or backend sessions).
- Multi-conversation tabs / sidebar of past threads.
- File or image attachments.
- Authentication / per-user state.

---

## 3. Layout & chrome

- **Position:** unchanged — sticky right panel, mounted in `App.jsx` when `chatOpen` is true.
- **Width:** grow from `w-80` (320px) to `w-96` (384px).
- **Panel background:** `bg-gradient-to-b from-brand-50/40 via-white to-white` instead of flat `bg-white`. Replaces the left border with `shadow-chrome` for a softer separator.
- **Header (`ChatHeader.jsx`, new):**
  - Left: 24px `SparkAvatar` (teal gradient circle, sparkle SVG inside).
  - Middle: stacked text — `PSIA AI` (`text-sm font-semibold text-gray-900`) above `Ask your data` (`text-[11px] text-brand-700`).
  - Right: ghost close button (`text-gray-400 hover:text-gray-600`, no border).
  - No bottom border; subtle `shadow-chrome` instead.

---

## 4. Empty state (`EmptyState.jsx`, new)

Rendered inside the message area when `messages.length === 0`. Vertically centered.

- 48px `SparkAvatar` with a soft `shadow-[0_0_24px_rgba(45,212,191,0.35)]` glow.
- Heading: `How can I help today?` — `text-xl font-semibold text-gray-900`.
- Subhead: `Ask anything about global seaweed production, trade, or trends.` — `text-sm text-gray-500`.
- Four full-width suggestion chips, stacked with `space-y-2`:
  - `📈  Top 5 producers in 2022`
  - `🌏  Compare China vs Indonesia`
  - `💰  Aquaculture value trend`
  - `📊  Capture vs farming split`
- Chip style: `w-full text-left rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:border-brand-400 hover:bg-brand-50/50 transition-colors`.
- Clicking a chip submits that prompt immediately (no edit step). Chips do not reappear once the thread has any messages.

---

## 5. Message rendering

### 5.1 User messages

- Right-aligned, `max-w-[85%]`.
- `bg-gradient-to-b from-brand-600 to-brand-700 text-white`.
- `rounded-2xl rounded-br-md` (flattened bottom-right corner).
- `px-4 py-2.5 text-sm shadow-card`.
- Content rendered as plain text with `whitespace-pre-wrap`.

### 5.2 Assistant messages (`AssistantMessage.jsx`, new)

- Left-aligned, full available width — **no bubble, no border, no background**.
- Top row: 20px `SparkAvatar` + `PSIA AI` label (`text-xs font-medium text-gray-500`), then a 4px gap before the body.
- Body: rendered as markdown via `react-markdown` + `remark-gfm`. Base typography: `text-sm text-gray-800 leading-relaxed`.
- Code blocks: `bg-gray-900 text-gray-100 rounded-lg p-3 text-xs font-mono overflow-x-auto`.
- Inline code: `bg-gray-100 text-gray-800 rounded px-1 py-0.5 text-[0.85em] font-mono`.
- Lists, headings, bold: default markdown styling tuned to `prose-sm` rhythm (no `@tailwindcss/typography` dependency required — explicit classes on the `react-markdown` `components` map).

### 5.3 Hover actions (assistant only)

A thin row appears below the body on `hover` of the message container:
- `Copy` (clipboard icon) — copies the assistant text to clipboard; swaps to `Copied ✓` for 1.5s.
- `Regenerate` (refresh icon) — re-submits the previous user prompt, replacing the last assistant message.
- Buttons: `text-xs text-gray-400 hover:text-brand-600`, ghost style, 4px gap, only shown after the streaming-look animation completes.

### 5.4 SQL toggle & result table

Preserved functionality, restyled:
- `View SQL` becomes a ghost chip: `text-xs text-brand-700 hover:bg-brand-50 px-2 py-1 rounded-md` with a chevron that rotates 90° on open.
- `ResultTable` (the existing component) is wrapped in `rounded-xl border border-gray-200 bg-white shadow-card p-2`.

### 5.5 Spacing

- `space-y-6` between turns in `MessageThread`.
- `mt-1` between the avatar row and the assistant body.

---

## 6. Composer (`ChatInput.jsx`, refactored)

- **Outer container:** sticky to bottom, `border-t border-gray-100 bg-gradient-to-b from-white to-brand-50/30 px-3 pt-3 pb-4`.
- **Input shell:** a single pill that contains textarea + toolbar.
  - `rounded-2xl border border-gray-200 bg-white shadow-card`.
  - On `focus-within`: `border-brand-400 shadow-card-hover ring-4 ring-brand-100/60`.
  - Inner padding `px-3 pt-2.5 pb-2`.
- **Textarea:**
  - Borderless, `bg-transparent`, `text-sm text-gray-900 placeholder:text-gray-400`.
  - Auto-grow from 1 → 6 rows. Implementation: measure `scrollHeight` on input, set `rows` accordingly (clamped to 6).
  - Placeholder: `Ask anything about seaweed data…`.
  - `Enter` submits, `Shift+Enter` newline (unchanged).
- **Bottom toolbar** (inside the pill):
  - Left: `text-[11px] text-gray-400` hint `Enter to send · Shift+Enter for newline`.
  - Right: send/stop button — `w-8 h-8 rounded-lg`.
    - Idle, with text: `bg-brand-600 hover:bg-brand-700 text-white`, paper-plane icon.
    - Idle, no text: `bg-gray-100 text-gray-300`, disabled.
    - Loading: `bg-gray-200 text-gray-700`, stop (square) icon. Clicking it cancels the in-flight fetch and the streaming-look animation.
- **Footer line:** below the pill, centered `text-[11px] text-gray-400`: `PSIA AI can make mistakes — verify important data.`

---

## 7. Streaming-look animation

Backend returns the full answer in one shot. We fake streaming on the client to convey responsiveness:

1. When the user submits, push the user message and a placeholder assistant message with `streaming: true` and empty `content`.
2. While the fetch is pending, the placeholder renders the typing indicator (3 dots, `TypingDots.jsx`) below the avatar row.
3. Once `resp.json()` resolves, store the full answer separately and reveal it progressively: a `setInterval` (or `requestAnimationFrame` loop) appends ~3 characters every 18ms (~600 chars/s) to the displayed `content`.
4. A single click anywhere inside the panel during animation snaps to the full answer.
5. Hover actions (Copy, Regenerate) are hidden until the animation completes.
6. The composer send button stays in `Stop` state until both the fetch and the animation finish; clicking it cancels both (`AbortController` + clearing the interval).

**Why fake it:** real SSE requires `EventSourceResponse` in FastAPI plus Groq streaming wiring — separate scope. The visual effect carries the "modern" feel; the wire protocol can be upgraded later without touching the UI.

---

## 8. Error state

If the fetch throws or the response is non-OK:
- No avatar / no `PSIA AI` label above it (signals system, not assistant).
- Inline notice block: `bg-rose-50 border border-rose-200 text-rose-800 rounded-lg px-3 py-2 text-sm`.
- Copy: `Something went wrong. Is the backend running?` (preserved from current behavior).
- No SQL toggle, no hover actions.

---

## 9. Theme color usage

| Element | Token |
|---|---|
| User bubble background | `bg-gradient-to-b from-brand-600 to-brand-700` |
| Assistant avatar gradient | `from-brand-400 to-brand-700` + glow `shadow-[0_0_20px_rgba(45,212,191,0.35)]` |
| Send button active | `bg-brand-600 hover:bg-brand-700` |
| Composer focus ring | `ring-brand-100/60` + `border-brand-400` |
| Suggestion chip hover | `border-brand-400 bg-brand-50/50` |
| SQL toggle chip | `text-brand-700 hover:bg-brand-50` |
| Panel background gradient | `from-brand-50/40 via-white to-white` |
| Typing dots | `bg-brand-400` |
| Header subtitle | `text-brand-700` |
| Error notice | `bg-rose-50 / border-rose-200 / text-rose-800` |

Neutral grays (`gray-200` borders, `gray-500/600/800` text) carry all non-brand surfaces so the teal accents stay distinct.

---

## 10. Component map

```
src/components/chat/
├── ChatPanel.jsx          container, fetch, message state, AbortController
├── ChatHeader.jsx         NEW — branded header + close button
├── EmptyState.jsx         NEW — greeting + 4 suggestion chips
├── MessageThread.jsx      scroll container, renders messages + typing indicator
├── MessageBubble.jsx      branches: UserMessage vs AssistantMessage
├── AssistantMessage.jsx   NEW — avatar row + markdown body + hover actions + SQL/table
├── TypingDots.jsx         NEW — 3 animated dots
├── SparkAvatar.jsx        NEW — teal gradient circle w/ sparkle SVG (sized via prop)
└── ChatInput.jsx          composer pill, auto-resize textarea, send/stop button
```

### Responsibilities

- `ChatPanel` owns: `messages`, `loading`, `streaming`, `abortController`, fetch logic, suggestion-chip submit handler.
- `MessageBubble` decides user-vs-assistant routing and renders the user pill inline; delegates assistant rendering to `AssistantMessage`.
- `AssistantMessage` owns: markdown rendering, hover-action state, SQL toggle state, streaming-character animation.
- `SparkAvatar` is a stateless presentation component reused in 3 places (header, empty-state, each assistant message). Accepts a `size` prop.

---

## 11. New dependencies

- `react-markdown` (~12 kb gz)
- `remark-gfm` (~13 kb gz)

No backend / Python deps change.

---

## 12. Testing

- Vitest unit tests for:
  - `SparkAvatar` renders at the requested size.
  - `EmptyState` calls `onSubmit` with the chip's prompt when clicked.
  - `ChatInput` auto-grows up to 6 rows and clamps beyond that.
  - `AssistantMessage` reveals characters progressively over time (fake timers).
  - Click-to-skip during streaming animation completes the message immediately.
- No existing chat tests today; do not add a `ChatPanel` integration test as part of this redesign — the manual checklist below covers it.

Manual verification (because UI):
- Open panel from topbar, observe empty state and chips.
- Click a chip → user bubble appears, typing dots appear, response streams in.
- Hover assistant message → copy + regenerate buttons appear; verify copy puts text in clipboard.
- Click `View SQL` → SQL pre-block expands beneath.
- Submit a query that returns a table → `ResultTable` renders inside the assistant message.
- Trigger an error (stop backend) → red inline notice, no avatar.
- Resize the browser narrow → panel still legible at 384px.

---

## 13. Out of scope (recap)

- Real SSE streaming.
- Persisting threads across reloads.
- Multi-conversation history.
- Attachments.
- Voice input.
- Accessibility audit beyond keeping `aria-label`s on icon buttons and `role="dialog"` on the panel (deeper a11y work tracked separately if needed).
