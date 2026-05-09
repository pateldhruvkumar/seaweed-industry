# Seaweed Industry — Text-to-SQL Chatbot Design

**Date:** 2026-05-08
**Status:** Approved

---

## Overview

Add a "Chat with your data" panel to the right side of the existing seaweed industry React dashboard. Users type natural language questions; the system generates SQL via a cloud LLM, executes it against the four seaweed CSV datasets loaded into DuckDB, and returns results as inline tables or plain text.

RAG (pure vector retrieval) was ruled out because the datasets are structured and numerical. Text-to-SQL is the correct paradigm. Embeddings are used narrowly: entity resolution (fuzzy user terms → actual column values) and few-shot retrieval (similar past Q→SQL pairs to guide the LLM).

---

## Datasets

Four CSVs loaded as DuckDB tables at backend startup:

| Table name | File | Rows | Key difference |
|---|---|---|---|
| `seaweed_aquaculture_quantity` | `dataset/seaweed_aquaculture_quantity.csv` | 4,597 | Has `ENVIRONMENT.ALPHA_2_CODE` |
| `seaweed_aquaculture_value` | `dataset/seaweed_aquaculture_value.csv` | 3,405 | Has `ENVIRONMENT.ALPHA_2_CODE` |
| `seaweed_capture_quantity` | `dataset/seaweed_capture_quantity.csv` | 7,302 | No environment column |
| `seaweed_global_production` | `dataset/seaweed_global_production.csv` | 11,899 | Has `PRODUCTION_SOURCE_DET.CODE` |

**Shared columns across all tables:**
`COUNTRY.UN_CODE`, `SPECIES.ALPHA_3_CODE`, `AREA.CODE`, `MEASURE`, `PERIOD`, `VALUE`, `STATUS`, `UN_Code`, `Country_Name`, `Continent_Group_En`, `EcoClass_Group_En`, `GeoRegion_Group_En`, `3A_Code`, `Identifier`, `Seaweed_Name`, `Scientific_Name`, `CPC_Class_En`

---

## Stack

| Layer | Technology | Reason |
|---|---|---|
| SQL engine | DuckDB (in-memory) | Zero setup, fast on CSV, runs in Python process |
| LLM (SQL generation) | Groq API — `qwen-qwq-32b` | Free tier, purpose-built for code/SQL, fast |
| Embedding model | `BAAI/bge-small-en-v1.5` (sentence-transformers) | 33 MB, runs on CPU, top MTEB scores at small size |
| Vector search | numpy cosine similarity | Corpus is small (~500 entities, ~50 few-shot pairs); no FAISS needed |
| Backend | FastAPI (Python) | Single endpoint, async, CORS for React |
| Frontend | React (existing Vite app) | Chat panel added as a new component tree |

---

## Architecture

```
React Dashboard
├── ExistingContent (charts, EDA — unchanged)
└── ChatPanel (new, right sidebar, 380px fixed width)
    ├── MessageThread
    │   └── MessageBubble (×n)
    └── ChatInput

        │  POST /chat
        ▼

FastAPI Backend
└── Query Pipeline
    ├── 1. Entity resolution    (bge-small + numpy)
    ├── 2. Few-shot retrieval   (bge-small + numpy)
    ├── 3. Prompt assembly
    ├── 4. Groq API call
    ├── 5. SQL validation + DuckDB execution
    └── 6. Response formatting

    ├── DuckDB (4 tables, loaded once at startup)
    └── In-memory vector store (entity index + few-shot index)
```

---

## Query Pipeline (Step by Step)

### Step 1 — Entity Resolution

Pre-compute embeddings for all distinct values in these columns:
- `Country_Name` (~170 values)
- `Seaweed_Name` (~15 values)
- `Scientific_Name` (~15 values)
- `GeoRegion_Group_En` (~20 values)
- `Continent_Group_En` (~8 values)
- `CPC_Class_En` (~3 values)

At query time: embed the user question, run cosine similarity against the entity index, take top-3 matches above a 0.75 threshold, inject as hints into the prompt.

Example: user says "kelp" → resolves to `Brown algae` / `Phaeophyta` → LLM uses the correct `WHERE Seaweed_Name = 'Brown algae'` filter.

### Step 2 — Few-Shot Retrieval

Maintain a JSON file of hand-written `question → SQL` pairs (seed with ~20 examples at launch, grows over time). Embed each question at startup, store in numpy array. At query time: embed user question, find top-3 cosine-similar pairs, include them in the prompt as worked examples.

### Step 3 — Prompt Assembly

```
System:
  You are a SQL expert. Use DuckDB SQL syntax.
  Only write SELECT statements.
  Tables and columns: [full schema]
  Entity hints: [from step 1, if any]
  Examples: [3 Q→SQL pairs from step 2]

User:
  [conversation history — last 10 messages]
  [current question]
```

### Step 4 — Groq API Call

Model: `qwen-qwq-32b` on Groq free tier.
Temperature: 0 (deterministic SQL output).
Max tokens: 512 (SQL queries are short).
Extract the SQL block from the response — strip markdown fences if present.

### Step 5 — SQL Validation + Execution

Before running:
- Strip leading/trailing whitespace and markdown fences.
- Confirm the statement starts with `SELECT` (case-insensitive). Reject anything else with a clear error.
- Execute via DuckDB. Catch exceptions and return a structured error.

### Step 6 — Response Formatting

```json
{
  "answer": "China produced the most seaweed in 2022 with 1.84M tonnes.",
  "sql": "SELECT Country_Name, SUM(VALUE) as total FROM ...",
  "data": [{"Country_Name": "China", "total": 1842303.5}],
  "type": "table"
}
```

`type` values:
- `scalar` — single value result → rendered as plain text in chat bubble
- `table` — multi-row result → rendered as inline table in chat bubble
- `error` — SQL failed or returned no rows → error message + failed SQL shown

The `answer` field is a one-sentence plain-language summary always generated alongside the SQL (second Groq call with the result data, or template-based for simple scalars).

---

## API

### `POST /chat`

**Request:**
```json
{
  "message": "Which country produced the most seaweed in 2022?",
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

**Response (success):**
```json
{
  "answer": "China produced the most seaweed in 2022 with 1.84M tonnes.",
  "sql": "SELECT Country_Name, SUM(VALUE) as total FROM seaweed_global_production WHERE PERIOD = 2022 GROUP BY Country_Name ORDER BY total DESC LIMIT 1",
  "data": [{"Country_Name": "China", "total": 1842303.5}],
  "type": "scalar"
}
```

**Response (error):**
```json
{
  "answer": "I couldn't find data matching that question.",
  "sql": "SELECT ...",
  "data": [],
  "type": "error"
}
```

CORS: allow `http://localhost:5173` (Vite dev server) and `http://localhost:4173` (Vite preview).

### `GET /health`

Returns `{"status": "ok"}`. Used to verify backend is running.

---

## React Chat Panel

### Layout Integration

The dashboard root switches from a single-column layout to a flex row when the chat panel is open:

```
┌──────────────────────────┬──────────────────┐
│  Existing dashboard      │  Chat Panel      │
│  (flex: 1, min-width 0)  │  (width: 380px,  │
│                          │   fixed)         │
└──────────────────────────┴──────────────────┘
```

A toggle button (chat icon) in the dashboard header opens/closes the panel. Closing restores full-width layout. Panel state is local React state (not persisted).

### Components

**`ChatPanel`**
- Container with `380px` fixed width, full viewport height, border-left
- Header: "Ask your data" label + close (`✕`) button
- Renders `MessageThread` + `ChatInput`
- Holds `messages` state (array of `{role, content, data, sql, type}`)
- Calls `POST /chat` on submit, appends assistant response to messages

**`MessageThread`**
- Scrollable list of `MessageBubble` components
- `useEffect` auto-scrolls to bottom on new message
- Shows loading bubble (`...` pulsing) while request is in-flight

**`MessageBubble`**
- User messages: right-aligned, styled distinctly
- Assistant messages: left-aligned, contains:
  - Plain text answer
  - Inline `ResultTable` if `type === "table"` (max 10 rows, "Show all" expand)
  - Collapsible `▶ View SQL` disclosure showing the raw SQL

**`ChatInput`**
- `<textarea>` that grows up to 4 lines
- Enter submits, Shift+Enter adds newline
- Disabled + spinner while request is in-flight
- Clears on submit

### Conversation History

Frontend holds the full message array in state. On each submit, sends the last 10 messages as `history` to the backend. This gives Groq enough context for follow-up questions ("now show me the same for 2021") without bloating the prompt.

---

## File Structure

```
seaweed-industry/
├── dataset/                          (existing, unchanged)
├── src/                              (existing React app)
│   ├── components/
│   │   └── chat/
│   │       ├── ChatPanel.jsx
│   │       ├── MessageThread.jsx
│   │       ├── MessageBubble.jsx
│   │       ├── ChatInput.jsx
│   │       └── ResultTable.jsx
│   └── App.jsx                       (add ChatPanel + toggle)
└── backend/
    ├── main.py                       (FastAPI app + startup)
    ├── pipeline.py                   (6-step query pipeline)
    ├── db.py                         (DuckDB loader)
    ├── embeddings.py                 (bge-small loader + search)
    ├── few_shots.json                (seed Q→SQL examples)
    └── requirements.txt
```

---

## Few-Shot Seed Examples (minimum 20 at launch)

Representative questions to write SQL for before launch:

1. Top N countries by total production in a given year
2. Year-over-year production for a specific country
3. Total aquaculture value for a specific continent
4. Which seaweed species is most produced globally
5. Compare capture vs aquaculture quantity for a country
6. Production trend for a species over all available years
7. Countries in a specific geographic region by volume
8. Highest-value vs highest-quantity species comparison
9. Average production per country by economic class
10. Which years have the most complete data (fewest STATUS anomalies)

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Groq returns no SQL block | Return `type: error` with message "Could not generate a query for that question." |
| Generated SQL is not a SELECT | Return `type: error` with message "Only read queries are supported." |
| DuckDB execution fails | Return `type: error` with the DuckDB exception message (sanitized) |
| DuckDB returns 0 rows | Return `type: error` with "No data found matching that question." |
| Groq API rate-limited | Return `type: error` with "Service temporarily unavailable, please try again." |

---

## Out of Scope

- Authentication / user accounts
- Persisting conversation history across page refreshes
- Chart generation from query results (can be added later)
- Write operations (INSERT / UPDATE) against the data
- Streaming token-by-token responses (standard request/response is sufficient)
