# AI Chat Enhancements — Design

**Date:** 2026-06-10
**Status:** Approved (design); implementation pending
**Author:** brainstormed with Claude Code

## Summary

The PSIA AI chat is a text-to-SQL assistant: a question goes to the backend
(`backend/pipeline.py`), a Groq LLM writes DuckDB SQL, the result is executed and
returned as `{ answer, sql, data, type }`, and the frontend renders the answer plus
a paginated table.

This design adds three enhancements, delivered as three independently shippable
phases:

- **Phase A — Richer answers:** render a chart in the response when the data is
  chartable, and show AI-suggested follow-up questions. Both ride the same backend
  response change.
- **Phase B — Edit & resend:** let the user edit a previous message and re-run from
  that point (branching the conversation).
- **Phase C — Saved threads:** persist conversations in `localStorage`, with a
  thread list to revisit / start new ones.

**Recommended implementation order:** A → B → C. Phase A is the highest-impact and
reuses the existing chart library; B and C are frontend-only.

## Current architecture (as built)

### Backend (`backend/`)
- FastAPI app (`main.py`), `POST /chat` → `pipeline.run(message, history, groq_client)`.
- `pipeline.run`:
  1. `resolve_entities` + `retrieve_fewshots` (embeddings) build a system prompt.
  2. Groq (`llama-3.3-70b-versatile`) generates a DuckDB `SELECT`.
  3. Non-`SELECT` → `type: 'error'`.
  4. Execute against DuckDB; empty/failed → `type: 'error'`.
  5. `_classify_type`: 1×1 result → `scalar` (templated answer); otherwise `table`
     (a second Groq call writes a one-sentence summary).
  6. Returns `{ answer, sql, data, type }`.

### Frontend (`src/components/chat/`)
- `ChatPanel` — owns `messages` state, POSTs to `http://localhost:8000/chat`,
  sends the last 10 messages as `history`, handles stop/regenerate. Streaming is a
  client-side typewriter effect over the returned `answer` (not server streaming).
- `MessageThread` → `MessageBubble` → `AssistantMessage`.
- `AssistantMessage` — markdown (react-markdown + remark-gfm), typewriter reveal,
  `ResultTable` when `type === 'table'`, View-SQL toggle, Copy + Regenerate
  (regenerate shown only on the last assistant message).
- `EmptyState` — 4 hardcoded starter suggestions.
- Chart library already in repo: `src/components/charts/{Line,Bar,Area,Scatter,Radar,Donut}Chart.jsx`,
  `Heatmap.jsx` — generic Recharts wrappers taking a flat `data` array + key-name
  props (`LineChart`: `data,xKey,yKey,groupKey,height`; `BarChart`:
  `data,labelKey,valueKey,orientation,height`). Themed via `src/lib/chartTheme.js`.
- Tests: vitest + React Testing Library, `*.test.jsx` co-located.

## Phase A — Charts + suggested follow-ups

### A.1 Backend response shape

Extend the `/chat` response to:

```jsonc
{
  "answer": "string",
  "sql": "string",
  "data": [ /* rows */ ],
  "type": "scalar" | "table" | "error",
  "chart": { "kind": "line"|"bar"|"donut"|"scatter",
             "x": "colName", "y": "colName", "series": "colName"|null } | null,
  "suggestions": ["string", "string", "string"]   // 0–3 items
}
```

`error` responses keep `chart: null, suggestions: []`.

### A.2 Backend enrichment call

Replace the existing table-summary Groq call with a single **enrichment** call that
returns strict JSON. It receives: the user question, the column names (and inferred
dtypes), and the first ~5 rows. It returns:

```jsonc
{
  "summary": "one-sentence answer",
  "suggestions": ["follow-up 1", "follow-up 2", "follow-up 3"],
  "chart": { "kind": "...", "x": "...", "y": "...", "series": null } | null
}
```

Rules:
- The LLM sets `chart` only when the question implies a specific visual ("trend",
  "over time", "compare", "pie/share", "plot ...") **and** the named columns exist in
  the result. Otherwise `chart: null` (frontend heuristic decides — hybrid).
- `kind` ∈ {line, bar, donut, scatter}. `x`/`y`/`series` must be actual column names.

Validation & fallback (server-side, after the call):
- Parse JSON; on any parse error, fall back to today's behavior: `answer` = a plain
  summary string (or first attempt's raw text trimmed), `chart: null`,
  `suggestions: []`. **The chat must never break because enrichment failed.**
- Drop `chart` if `x`/`y`/`series` are not present in the result columns.
- Trim `suggestions` to at most 3 non-empty strings.

`scalar` results: keep the templated answer. Still request suggestions, but force
`chart: null` (a single number is not chartable).

Backend tests (`backend/tests/test_pipeline.py`): valid JSON parsed correctly;
malformed JSON falls back without raising; chart with unknown columns is dropped;
suggestions capped at 3; scalar forces `chart:null`.

### A.3 Frontend — chart selection (hybrid)

New `src/lib/chatChart.js`:

```
inferChartSpec(data, hint) -> spec | null
```

- If `hint` is present and valid against `data` columns, return it.
- Otherwise heuristic over `data`:
  - Detect a **time** column: `PERIOD`, or an integer column whose values look like
    years (e.g. 1950–2100).
  - Detect **numeric** value column(s) and an optional **category** (string) column.
  - time + numeric (+ optional category) → `line` (`series` = category if it has >1
    distinct value).
  - category + single numeric, no time → `bar`.
  - two numeric columns, no time/category → `scatter`.
  - otherwise → `null`.
- Guards: require ≥2 rows; cap series to ~8 (keep top series by total, fold the rest
  out); cap bar categories to ~15. `donut` is only produced via an explicit backend
  `hint` (too ambiguous to infer safely).

Pure function, unit-tested with representative data shapes.

### A.4 Frontend — chart rendering

New `src/components/chat/ChatChart.jsx`: takes `data` + resolved `spec`, renders the
matching existing chart component at a compact height (~240px) sized for the panel
width. Maps spec → component props:
- `line` → `LineChart` (`xKey=spec.x, yKey=spec.y, groupKey=spec.series`)
- `bar` → `BarChart` (`labelKey=spec.x, valueKey=spec.y`)
- `donut` → `DonutChart` (`labelKey=spec.x, valueKey=spec.y`)
- `scatter` → `ScatterChart` (`xKey=spec.x, yKey=spec.y`)

(The `LineChart`/`BarChart` prop names above were read from source; `DonutChart` and
`ScatterChart` prop names are assumed and must be confirmed against their components
during implementation.)

In `AssistantMessage`: after the typewriter is `done`, compute the spec via
`inferChartSpec(data, chart)`. If non-null, render `<ChatChart>` **above** the
existing `ResultTable` (both stacked). If null, behave exactly as today.

### A.5 Frontend — suggested follow-ups

- Thread `suggestions` (and the existing `onSuggestion`/`sendMessage` callback) down
  `MessageThread` → `MessageBubble` → `AssistantMessage`.
- Render `suggestions` as small pill/chip buttons under the **latest** assistant
  message only (same gating as Regenerate), once the message is `done`.
- Clicking a chip calls `sendMessage(text)` — the normal send path.

Frontend tests: `inferChartSpec` shape cases; `ChatChart` renders the right component
for each `kind`; suggestion chips render and clicking invokes the callback; chips show
only on the last assistant message.

## Phase B — Edit & resend (frontend only)

- User `MessageBubble` gets a hover **Edit** affordance → switches that bubble to an
  inline `textarea` with Save / Cancel.
- `ChatPanel.editMessage(index, newText)`:
  - Truncate `messages` to `index` (discard that message and everything after).
  - Append the edited user message (`newText`) and run the existing send flow, so the
    assistant re-answers from the edited point. This branches by discarding the old
    continuation.
- Thread the message index + `onEdit` through `MessageThread` → `MessageBubble`.
- Reuses the existing fetch/abort path; no backend change.

Tests: editing message `i` truncates `messages` to length `i`, then sends `newText`;
Cancel restores the original text without sending.

## Phase C — Saved threads in localStorage (frontend only)

- `src/lib/threadStore.js` — CRUD over `localStorage` key `psia.threads`:
  - Schema: `{ id, title, createdAt, updatedAt, messages }[]`.
  - `title` auto-derived from the first user message (truncated ~40 chars).
  - Persist only display fields per message (`role, content, sql, data, type, chart,
    suggestions`); store messages as already-`done` (no `streaming`/`targetContent`).
  - All reads/writes wrapped in try/catch; on parse or quota error, treat as empty
    and start fresh (never throw into the UI).
- `ChatPanel`:
  - On mount, load the most-recently-updated thread (or start empty).
  - Debounce-save the active thread whenever `messages` changes.
  - "New chat" creates a fresh thread and clears the view.
  - Switching threads loads that thread's messages.
- `ChatHeader` gets a **history** icon → opens an in-panel slide-over thread list:
  list of titles + relative timestamps, click to load, delete button per thread, and a
  "New chat" action at the top.

Tests (`threadStore`): create/list/get/update/delete round-trips; title derivation;
corrupt-JSON read returns empty list without throwing.

## Cross-cutting concerns

- **Error handling:** every new LLM-dependent or storage-dependent path degrades to
  current behavior on failure (enrichment → plain answer; invalid chart hint →
  heuristic → no chart; localStorage error → ephemeral session).
- **No new dependencies:** Recharts, react-markdown, and vitest are already present.
- **CORS / API:** unchanged; the response is a superset of today's shape, so an old
  frontend against a new backend (or vice versa) keeps working (missing fields treated
  as `null`/`[]`).
- **Performance:** the enrichment call replaces (not adds to) the existing summary
  call for tables, so Phase A adds no extra round-trip for table answers; scalar
  answers gain one small call for suggestions.

## Out of scope (YAGNI)

- Server-side persistence / user accounts / cross-device sync (threads are
  per-browser).
- Server-streamed tokens (the typewriter stays client-side).
- Drill-down "refine in place" beyond what suggested follow-ups + edit/resend cover.
- Exporting/sharing charts or conversations.
```
