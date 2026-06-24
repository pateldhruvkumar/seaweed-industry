# AI Chat Phase A — Charts + Suggested Follow-ups — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the chat answers with a multi-row table, render a chart above the table (chart type chosen by a backend hint or, failing that, a frontend heuristic) and show 2–3 AI-suggested follow-up questions as clickable chips under the latest answer.

**Architecture:** The backend `/chat` response gains two fields — `chart` (a hint object or `null`) and `suggestions` (0–3 strings) — produced by upgrading the existing table-summary LLM call into a single "enrichment" call that returns strict JSON, with a safe fallback to today's behavior on any parse failure. The frontend adds a pure `inferChartSpec(data, hint)` (hybrid: honor a valid hint, else infer from data shape), a `ChatChart` component that maps a spec onto the existing Recharts wrappers, and suggestion chips rendered only on the last assistant message.

**Tech Stack:** Python / FastAPI / Groq / DuckDB (backend); React 18 / Recharts / react-markdown / Vitest + React Testing Library (frontend).

**Spec:** `docs/superpowers/specs/2026-06-10-ai-chat-enhancements-design.md`

**Deviation from spec (deliberate):** Scalar (single-value) answers return `suggestions: []` and `chart: null` with **no** extra LLM call. Charts and follow-ups apply to table answers only in Phase A. This keeps the scalar path deterministic and avoids adding latency to it. Revisit in a later phase if scalar follow-ups prove valuable.

---

## File Structure

**Backend:**
- Modify `backend/pipeline.py` — add `_extract_json`, `_validate_chart`, `_coerce_suggestions`, `_enrich`; refactor `run` to return `chart` + `suggestions`.
- Modify `backend/tests/test_pipeline.py` — update mock + existing table test; add enrichment tests.

**Frontend:**
- Create `src/lib/chatChart.js` — pure `inferChartSpec(data, hint)`.
- Create `src/lib/chatChart.test.js` — unit tests for the heuristic + hint handling.
- Create `src/components/chat/ChatChart.jsx` — maps a spec → existing chart component, with row/series caps.
- Create `src/components/chat/ChatChart.test.jsx` — dispatch + capping tests (chart components mocked).
- Modify `src/components/chat/AssistantMessage.jsx` — render `ChatChart` above the table; render suggestion chips.
- Modify `src/components/chat/AssistantMessage.test.jsx` — chart-presence + chip tests.
- Modify `src/components/chat/MessageBubble.jsx` — forward `chart`, `suggestions`, `onSuggestion`.
- Modify `src/components/chat/MessageThread.jsx` — pass `chart`/`suggestions` to every bubble; `onSuggestion` only to the last assistant bubble.
- Modify `src/components/chat/ChatPanel.jsx` — read `chart`/`suggestions` from the response and store them on the assistant message.

---

## Task 1: Backend enrichment helpers (pure functions)

**Files:**
- Modify: `backend/pipeline.py`
- Test: `backend/tests/test_pipeline.py`

- [ ] **Step 1: Write the failing tests**

Append to `backend/tests/test_pipeline.py`:

```python
def test_extract_json_plain():
    assert pipeline._extract_json('{"a": 1}') == {"a": 1}


def test_extract_json_with_fences_and_prose():
    raw = 'Sure! ```json\n{"a": 1, "b": "x"}\n``` done'
    assert pipeline._extract_json(raw) == {"a": 1, "b": "x"}


def test_extract_json_invalid_returns_none():
    assert pipeline._extract_json("not json at all") is None
    assert pipeline._extract_json("") is None


def test_validate_chart_valid():
    cols = ["PERIOD", "VALUE", "Country_Name"]
    chart = {"kind": "line", "x": "PERIOD", "y": "VALUE", "series": "Country_Name"}
    assert pipeline._validate_chart(chart, cols) == chart


def test_validate_chart_unknown_kind():
    assert pipeline._validate_chart(
        {"kind": "pie", "x": "PERIOD", "y": "VALUE"}, ["PERIOD", "VALUE"]
    ) is None


def test_validate_chart_missing_column():
    assert pipeline._validate_chart(
        {"kind": "bar", "x": "nope", "y": "VALUE"}, ["PERIOD", "VALUE"]
    ) is None


def test_validate_chart_drops_bad_series():
    out = pipeline._validate_chart(
        {"kind": "line", "x": "PERIOD", "y": "VALUE", "series": "nope"},
        ["PERIOD", "VALUE"],
    )
    assert out == {"kind": "line", "x": "PERIOD", "y": "VALUE", "series": None}


def test_coerce_suggestions_caps_and_filters():
    assert pipeline._coerce_suggestions(["a", "  b  ", "", 5, "c", "d"]) == ["a", "b", "c"]


def test_coerce_suggestions_non_list():
    assert pipeline._coerce_suggestions("nope") == []
    assert pipeline._coerce_suggestions(None) == []
```

- [ ] **Step 2: Run the tests to verify they fail**

Run (from `backend/`): `python -m pytest tests/test_pipeline.py -k "extract_json or validate_chart or coerce" -v`
Expected: FAIL with `AttributeError: module 'pipeline' has no attribute '_extract_json'`.

- [ ] **Step 3: Implement the helpers**

In `backend/pipeline.py`, after `_extract_sql` (around line 58), add:

```python
_CHART_KINDS = {"line", "bar", "donut", "scatter"}


def _extract_json(text: str) -> dict | None:
    """Pull the first JSON object out of an LLM response, tolerating fences/prose."""
    if not text:
        return None
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end < start:
        return None
    try:
        parsed = json.loads(text[start : end + 1])
    except (json.JSONDecodeError, ValueError):
        return None
    return parsed if isinstance(parsed, dict) else None


def _validate_chart(chart, columns: list[str]) -> dict | None:
    """Return a normalized chart hint, or None if it is unusable."""
    if not isinstance(chart, dict):
        return None
    kind, x, y = chart.get("kind"), chart.get("x"), chart.get("y")
    if kind not in _CHART_KINDS or x not in columns or y not in columns:
        return None
    series = chart.get("series")
    if series is not None and series not in columns:
        series = None
    return {"kind": kind, "x": x, "y": y, "series": series}


def _coerce_suggestions(suggestions) -> list[str]:
    """Keep at most 3 non-empty strings."""
    if not isinstance(suggestions, list):
        return []
    out = []
    for s in suggestions:
        if isinstance(s, str) and s.strip():
            out.append(s.strip())
        if len(out) == 3:
            break
    return out
```

- [ ] **Step 4: Run the tests to verify they pass**

Run (from `backend/`): `python -m pytest tests/test_pipeline.py -k "extract_json or validate_chart or coerce" -v`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/pipeline.py backend/tests/test_pipeline.py
git commit -m "feat(backend): add chart-hint and suggestion enrichment helpers"
```

---

## Task 2: Backend `_enrich` + `run` returns chart/suggestions

**Files:**
- Modify: `backend/pipeline.py:67-134` (the `run` function) and add `_enrich`
- Test: `backend/tests/test_pipeline.py`

- [ ] **Step 1: Update the Groq mock and existing table test, and write new failing tests**

In `backend/tests/test_pipeline.py`, replace `_make_groq_mock` (lines 8–15) with:

```python
_DEFAULT_ENRICHMENT = '{"summary": "Result summary.", "suggestions": ["a", "b"], "chart": null}'


def _make_groq_mock(sql: str, enrichment: str = _DEFAULT_ENRICHMENT):
    """First create() call returns SQL; second returns the enrichment JSON string."""
    mock = MagicMock()
    first_call = MagicMock()
    first_call.choices[0].message.content = sql
    second_call = MagicMock()
    second_call.choices[0].message.content = enrichment
    mock.chat.completions.create.side_effect = [first_call, second_call]
    return mock
```

Replace the body of `test_run_returns_table` (lines 40–49) with:

```python
def test_run_returns_table(conn):
    with patch("pipeline.get_conn", return_value=conn):
        groq = _make_groq_mock(
            "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE PERIOD = 2022 GROUP BY Country_Name ORDER BY total DESC LIMIT 5",
            '{"summary": "China leads seaweed production in 2022.", "suggestions": ["How has China changed since 2010?", "Compare China vs Indonesia"], "chart": null}',
        )
        result = pipeline.run("top 5 countries in 2022", [], groq)
    assert result["type"] == "table"
    assert len(result["data"]) == 5
    assert "Country_Name" in result["data"][0]
    assert result["answer"] == "China leads seaweed production in 2022."
    assert result["suggestions"] == ["How has China changed since 2010?", "Compare China vs Indonesia"]
    assert result["chart"] is None
```

Add these new tests at the end of the file:

```python
def test_run_table_includes_valid_chart(conn):
    with patch("pipeline.get_conn", return_value=conn):
        groq = _make_groq_mock(
            "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE PERIOD = 2022 GROUP BY Country_Name ORDER BY total DESC LIMIT 5",
            '{"summary": "s", "suggestions": [], "chart": {"kind": "bar", "x": "Country_Name", "y": "total", "series": null}}',
        )
        result = pipeline.run("top 5 countries in 2022", [], groq)
    assert result["chart"] == {"kind": "bar", "x": "Country_Name", "y": "total", "series": None}


def test_run_table_drops_chart_with_unknown_column(conn):
    with patch("pipeline.get_conn", return_value=conn):
        groq = _make_groq_mock(
            "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE PERIOD = 2022 GROUP BY Country_Name ORDER BY total DESC LIMIT 5",
            '{"summary": "s", "suggestions": [], "chart": {"kind": "bar", "x": "nope", "y": "total"}}',
        )
        result = pipeline.run("top 5 countries in 2022", [], groq)
    assert result["chart"] is None


def test_run_table_malformed_enrichment_falls_back(conn):
    with patch("pipeline.get_conn", return_value=conn):
        groq = _make_groq_mock(
            "SELECT Country_Name, SUM(VALUE) AS total FROM seaweed_global_production WHERE PERIOD = 2022 GROUP BY Country_Name ORDER BY total DESC LIMIT 5",
            "I'm sorry, here is the data but not as JSON.",
        )
        result = pipeline.run("top 5 countries in 2022", [], groq)
    assert result["type"] == "table"
    assert result["suggestions"] == []
    assert result["chart"] is None
    assert isinstance(result["answer"], str) and result["answer"]


def test_run_scalar_has_empty_chart_and_suggestions(conn):
    with patch("pipeline.get_conn", return_value=conn):
        groq = _make_groq_mock(
            "SELECT COUNT(DISTINCT Country_Name) AS n FROM seaweed_global_production"
        )
        result = pipeline.run("how many countries are there?", [], groq)
    assert result["type"] == "scalar"
    assert result["chart"] is None
    assert result["suggestions"] == []
```

- [ ] **Step 2: Run the tests to verify they fail**

Run (from `backend/`): `python -m pytest tests/test_pipeline.py -k "run_" -v`
Expected: FAIL — e.g. `KeyError: 'suggestions'` / `KeyError: 'chart'`, and the table-summary assertion fails because `run` does not yet parse JSON.

- [ ] **Step 3: Add `_enrich` and refactor `run`**

In `backend/pipeline.py`, add `_enrich` just above `def run` (after the helpers from Task 1):

```python
def _enrich(question: str, rows: list[dict], groq_client: Groq) -> dict:
    """One LLM call returning {summary, suggestions, chart} for a table result.

    Any failure degrades to {summary: None, suggestions: [], chart: None} so the
    chat never breaks on a bad model response.
    """
    columns = list(rows[0].keys())
    prompt = (
        "You are a data analyst. Given a question and its query result, reply with "
        "ONLY a JSON object (no markdown fences, no prose) of this exact shape:\n"
        '{"summary": "<one sentence answering the question>", '
        '"suggestions": ["<short follow-up question>", "<another>"], '
        '"chart": {"kind": "line|bar|donut|scatter", "x": "<column>", '
        '"y": "<column>", "series": "<column or null>"} }\n'
        "Rules: suggestions = 2-3 short natural follow-up questions the user might ask "
        "next. Set chart ONLY when a visualization clearly fits (trend over time -> "
        "line, ranking -> bar, share of a total -> donut) and x/y are real columns; "
        "otherwise set chart to null.\n"
        f"Columns: {columns}\n"
        f"Question: {question}\n"
        f"Result rows (first 5): {rows[:5]}"
    )
    try:
        completion = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=300,
        )
        parsed = _extract_json(completion.choices[0].message.content)
    except Exception:
        parsed = None

    if not parsed:
        return {"summary": None, "suggestions": [], "chart": None}

    summary = parsed.get("summary")
    return {
        "summary": summary.strip() if isinstance(summary, str) and summary.strip() else None,
        "suggestions": _coerce_suggestions(parsed.get("suggestions")),
        "chart": _validate_chart(parsed.get("chart"), columns),
    }
```

Now replace the tail of `run` (from `result_type = _classify_type(rows)` to the end, currently lines 114–134) with:

```python
    result_type = _classify_type(rows)

    if result_type == "scalar":
        val = list(rows[0].values())[0]
        answer = f"The result is {val:,.2f}." if isinstance(val, float) else f"The result is {val}."
        return {
            "answer": answer,
            "sql": raw_sql,
            "data": rows,
            "type": "scalar",
            "chart": None,
            "suggestions": [],
        }

    enrichment = _enrich(question, rows, groq_client)
    answer = enrichment["summary"] or "Here are the results — see the table below."
    return {
        "answer": answer,
        "sql": raw_sql,
        "data": rows,
        "type": "table",
        "chart": enrichment["chart"],
        "suggestions": enrichment["suggestions"],
    }
```

Then add `"chart": None, "suggestions": []` to each of the three error-return dicts in `run` (the non-SELECT guard, the query-failed `except`, and the empty-`df` branch) so every response has the same shape. For example the non-SELECT guard becomes:

```python
        return {
            "answer": "Only read queries are supported.",
            "sql": raw_sql,
            "data": [],
            "type": "error",
            "chart": None,
            "suggestions": [],
        }
```

(Apply the same two added keys to the `Query failed:` and `No data found` returns.)

- [ ] **Step 4: Run the tests to verify they pass**

Run (from `backend/`): `python -m pytest tests/test_pipeline.py -v`
Expected: PASS (all tests, including the Task 1 helper tests and the existing scalar/non-select/bad-sql tests).

- [ ] **Step 5: Commit**

```bash
git add backend/pipeline.py backend/tests/test_pipeline.py
git commit -m "feat(backend): return chart hint and follow-up suggestions from /chat"
```

---

## Task 3: Frontend `inferChartSpec` (pure)

**Files:**
- Create: `src/lib/chatChart.js`
- Test: `src/lib/chatChart.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/chatChart.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { inferChartSpec } from './chatChart'

const TIME_SERIES = [
  { PERIOD: 2010, VALUE: 5, Country_Name: 'China' },
  { PERIOD: 2011, VALUE: 6, Country_Name: 'China' },
  { PERIOD: 2010, VALUE: 2, Country_Name: 'Japan' },
  { PERIOD: 2011, VALUE: 3, Country_Name: 'Japan' },
]

const RANKING = [
  { Country_Name: 'China', total: 100 },
  { Country_Name: 'Indonesia', total: 80 },
]

describe('inferChartSpec', () => {
  it('returns null for fewer than 2 rows or non-arrays', () => {
    expect(inferChartSpec([{ a: 1 }], null)).toBeNull()
    expect(inferChartSpec(null, null)).toBeNull()
    expect(inferChartSpec(undefined, null)).toBeNull()
  })

  it('infers a grouped line chart from a time + value + category shape', () => {
    expect(inferChartSpec(TIME_SERIES, null)).toEqual({
      kind: 'line', x: 'PERIOD', y: 'VALUE', series: 'Country_Name',
    })
  })

  it('infers a line with null series when there is one category value', () => {
    const data = [
      { year: 2010, VALUE: 5 },
      { year: 2011, VALUE: 6 },
    ]
    expect(inferChartSpec(data, null)).toEqual({
      kind: 'line', x: 'year', y: 'VALUE', series: null,
    })
  })

  it('infers a bar chart from a category + numeric shape with no time column', () => {
    expect(inferChartSpec(RANKING, null)).toEqual({
      kind: 'bar', x: 'Country_Name', y: 'total', series: null,
    })
  })

  it('infers a scatter chart from two numeric measures with no time/category', () => {
    const data = [
      { quantity: 10, value: 100 },
      { quantity: 20, value: 250 },
    ]
    expect(inferChartSpec(data, null)).toEqual({
      kind: 'scatter', x: 'quantity', y: 'value', series: null,
    })
  })

  it('honors a valid backend hint over the heuristic', () => {
    const hint = { kind: 'donut', x: 'Country_Name', y: 'total', series: null }
    expect(inferChartSpec(RANKING, hint)).toEqual(hint)
  })

  it('drops a hint series that is not a real column but keeps the chart', () => {
    const hint = { kind: 'bar', x: 'Country_Name', y: 'total', series: 'ghost' }
    expect(inferChartSpec(RANKING, hint)).toEqual({
      kind: 'bar', x: 'Country_Name', y: 'total', series: null,
    })
  })

  it('falls back to the heuristic when the hint references a missing column', () => {
    const hint = { kind: 'line', x: 'ghost', y: 'total', series: null }
    expect(inferChartSpec(RANKING, hint)).toEqual({
      kind: 'bar', x: 'Country_Name', y: 'total', series: null,
    })
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/chatChart.test.js`
Expected: FAIL — `Failed to resolve import "./chatChart"`.

- [ ] **Step 3: Implement `inferChartSpec`**

Create `src/lib/chatChart.js`:

```js
const CHART_KINDS = new Set(['line', 'bar', 'donut', 'scatter'])

function isNumericColumn(data, col) {
  let seen = false
  for (const row of data) {
    const v = row[col]
    if (v == null) continue
    if (typeof v !== 'number' || Number.isNaN(v)) return false
    seen = true
  }
  return seen
}

function isTimeColumn(data, col) {
  if (!isNumericColumn(data, col)) return false
  if (/period|year/i.test(col)) return true
  return data.every(row => {
    const v = row[col]
    return v == null || (Number.isInteger(v) && v >= 1900 && v <= 2100)
  })
}

function distinctCount(data, col) {
  return new Set(data.map(r => r[col])).size
}

/**
 * Hybrid chart selection. Returns a spec { kind, x, y, series } or null.
 * A valid backend `hint` wins; otherwise the chart is inferred from the
 * shape of `data`.
 */
export function inferChartSpec(data, hint) {
  if (!Array.isArray(data) || data.length < 2) return null
  const cols = Object.keys(data[0])

  if (hint && CHART_KINDS.has(hint.kind) && cols.includes(hint.x) && cols.includes(hint.y)) {
    const series = hint.series && cols.includes(hint.series) ? hint.series : null
    return { kind: hint.kind, x: hint.x, y: hint.y, series }
  }

  const numericCols = cols.filter(c => isNumericColumn(data, c))
  const timeCol = cols.find(c => isTimeColumn(data, c)) || null
  const categoryCols = cols.filter(c => !numericCols.includes(c))
  const measureCols = numericCols.filter(c => c !== timeCol)

  if (timeCol && measureCols.length >= 1) {
    const series = categoryCols.find(c => distinctCount(data, c) > 1) || null
    return { kind: 'line', x: timeCol, y: measureCols[0], series }
  }
  if (categoryCols.length >= 1 && measureCols.length >= 1) {
    return { kind: 'bar', x: categoryCols[0], y: measureCols[0], series: null }
  }
  if (measureCols.length >= 2) {
    return { kind: 'scatter', x: measureCols[0], y: measureCols[1], series: categoryCols[0] || null }
  }
  return null
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/chatChart.test.js`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/chatChart.js src/lib/chatChart.test.js
git commit -m "feat(chat): add hybrid inferChartSpec chart selector"
```

---

## Task 4: Frontend `ChatChart` component

**Files:**
- Create: `src/components/chat/ChatChart.jsx`
- Test: `src/components/chat/ChatChart.test.jsx`

- [ ] **Step 1: Write the failing tests** (chart components mocked so we test dispatch + caps, not Recharts)

Create `src/components/chat/ChatChart.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChatChart from './ChatChart'

vi.mock('../charts/LineChart', () => ({
  default: props => <div data-testid="line-chart"
    data-rows={props.data.length} data-xkey={props.xKey} data-ykey={props.yKey}
    data-groupkey={props.groupKey ?? ''} />,
}))
vi.mock('../charts/BarChart', () => ({
  default: props => <div data-testid="bar-chart"
    data-rows={props.data.length} data-labelkey={props.labelKey} data-valuekey={props.valueKey} />,
}))
vi.mock('../charts/DonutChart', () => ({
  default: props => <div data-testid="donut-chart"
    data-rows={props.data.length}
    data-haslabelvalue={String(props.data.every(d => 'label' in d && 'value' in d))} />,
}))
vi.mock('../charts/ScatterChart', () => ({
  default: props => <div data-testid="scatter-chart"
    data-xkey={props.xKey} data-ykey={props.yKey} data-labelkey={props.labelKey} />,
}))

const RANKING = Array.from({ length: 30 }, (_, i) => ({ name: `C${i}`, total: 100 - i }))

describe('ChatChart', () => {
  it('renders nothing when spec is null', () => {
    const { container } = render(<ChatChart data={RANKING} spec={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a LineChart and passes axis/group keys', () => {
    render(<ChatChart data={RANKING} spec={{ kind: 'line', x: 'name', y: 'total', series: 'name' }} />)
    const el = screen.getByTestId('line-chart')
    expect(el).toHaveAttribute('data-xkey', 'name')
    expect(el).toHaveAttribute('data-ykey', 'total')
  })

  it('renders a BarChart capped to 15 rows', () => {
    render(<ChatChart data={RANKING} spec={{ kind: 'bar', x: 'name', y: 'total', series: null }} />)
    const el = screen.getByTestId('bar-chart')
    expect(Number(el.getAttribute('data-rows'))).toBeLessThanOrEqual(15)
    expect(el).toHaveAttribute('data-labelkey', 'name')
    expect(el).toHaveAttribute('data-valuekey', 'total')
  })

  it('renders a DonutChart with {label,value} rows capped to 8', () => {
    render(<ChatChart data={RANKING} spec={{ kind: 'donut', x: 'name', y: 'total', series: null }} />)
    const el = screen.getByTestId('donut-chart')
    expect(Number(el.getAttribute('data-rows'))).toBeLessThanOrEqual(8)
    expect(el).toHaveAttribute('data-haslabelvalue', 'true')
  })

  it('renders a ScatterChart with x/y/label keys', () => {
    render(<ChatChart data={RANKING} spec={{ kind: 'scatter', x: 'total', y: 'total', series: 'name' }} />)
    const el = screen.getByTestId('scatter-chart')
    expect(el).toHaveAttribute('data-xkey', 'total')
    expect(el).toHaveAttribute('data-labelkey', 'name')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/chat/ChatChart.test.jsx`
Expected: FAIL — `Failed to resolve import "./ChatChart"`.

- [ ] **Step 3: Implement `ChatChart`**

Create `src/components/chat/ChatChart.jsx`:

```jsx
import LineChart from '../charts/LineChart'
import BarChart from '../charts/BarChart'
import DonutChart from '../charts/DonutChart'
import ScatterChart from '../charts/ScatterChart'
import { PLOT_COLORS } from '../../lib/chartTheme'

const HEIGHT = 240
const MAX_SERIES = 8
const MAX_BARS = 15
const MAX_SLICES = 8

function Card({ children }) {
  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white shadow-card p-2">
      {children}
    </div>
  )
}

function topSeriesRows(data, spec) {
  if (!spec.series) return data
  const totals = {}
  for (const r of data) {
    const k = String(r[spec.series])
    totals[k] = (totals[k] || 0) + (Number(r[spec.y]) || 0)
  }
  const keep = new Set(
    Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_SERIES)
      .map(e => e[0]),
  )
  return data.filter(r => keep.has(String(r[spec.series])))
}

export default function ChatChart({ data, spec }) {
  if (!spec || !Array.isArray(data) || data.length === 0) return null

  if (spec.kind === 'line') {
    return (
      <Card>
        <LineChart
          data={topSeriesRows(data, spec)}
          xKey={spec.x}
          yKey={spec.y}
          groupKey={spec.series || undefined}
          height={HEIGHT}
        />
      </Card>
    )
  }

  if (spec.kind === 'bar') {
    const rows = [...data]
      .filter(r => r[spec.y] != null && !Number.isNaN(Number(r[spec.y])))
      .sort((a, b) => Math.abs(Number(b[spec.y])) - Math.abs(Number(a[spec.y])))
      .slice(0, MAX_BARS)
    return (
      <Card>
        <BarChart data={rows} labelKey={spec.x} valueKey={spec.y} height={HEIGHT} />
      </Card>
    )
  }

  if (spec.kind === 'donut') {
    const rows = data
      .map(r => ({ label: String(r[spec.x]), value: Number(r[spec.y]) }))
      .filter(r => Number.isFinite(r.value))
      .sort((a, b) => b.value - a.value)
      .slice(0, MAX_SLICES)
    return (
      <Card>
        <DonutChart data={rows} colors={PLOT_COLORS} height={HEIGHT} />
      </Card>
    )
  }

  if (spec.kind === 'scatter') {
    return (
      <Card>
        <ScatterChart
          data={data}
          xKey={spec.x}
          yKey={spec.y}
          labelKey={spec.series || spec.x}
          height={HEIGHT}
        />
      </Card>
    )
  }

  return null
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/chat/ChatChart.test.jsx`
Expected: PASS (5 tests).

- [ ] **Step 5: Verify `PLOT_COLORS` is exported**

Run: `npx vitest run src/components/chat/ChatChart.test.jsx`
If it errors on the `PLOT_COLORS` import, open `src/lib/chartTheme.js` and confirm the export name; `LineChart.jsx` already imports `PLOT_COLORS` from there, so it should resolve. Fix the import to match the actual export if needed, then re-run.

- [ ] **Step 6: Commit**

```bash
git add src/components/chat/ChatChart.jsx src/components/chat/ChatChart.test.jsx
git commit -m "feat(chat): add ChatChart that maps a spec onto chart components"
```

---

## Task 5: Render the chart in AssistantMessage + wire the data through

**Files:**
- Modify: `src/components/chat/ChatPanel.jsx:50-62`
- Modify: `src/components/chat/MessageThread.jsx:33-50`
- Modify: `src/components/chat/MessageBubble.jsx`
- Modify: `src/components/chat/AssistantMessage.jsx`
- Test: `src/components/chat/AssistantMessage.test.jsx`

- [ ] **Step 1: Write the failing tests**

At the top of `src/components/chat/AssistantMessage.test.jsx` (after the imports, before `beforeEach`), add a mock so the real Recharts component is not exercised in jsdom:

```jsx
vi.mock('./ChatChart', () => ({ default: () => <div data-testid="chat-chart" /> }))
```

Add these tests inside the existing `describe('AssistantMessage', ...)` block:

```jsx
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
  expect(screen.getByTestId('chat-chart')).toBeInTheDocument()
})

it('does not render a chart for a single-row (scalar) result', () => {
  vi.useRealTimers()
  render(<AssistantMessage content="answer" type="scalar" data={[{ n: 5 }]} streaming={false} />)
  expect(screen.queryByTestId('chat-chart')).toBeNull()
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/chat/AssistantMessage.test.jsx`
Expected: FAIL — `chat-chart` not found (AssistantMessage does not render ChatChart yet).

- [ ] **Step 3: Update `AssistantMessage` to render the chart**

In `src/components/chat/AssistantMessage.jsx`:

Change the React import (line 1) to include `useMemo`:

```jsx
import { useEffect, useMemo, useRef, useState } from 'react'
```

Add these imports after the existing component imports (after line 6):

```jsx
import ChatChart from './ChatChart'
import { inferChartSpec } from '../../lib/chatChart'
```

Add `chart` to the destructured props (in the function signature, alongside `data`, `type`):

```jsx
export default function AssistantMessage({
  content,
  targetContent,
  sql,
  data,
  type,
  chart,
  streaming = false,
  onRegenerate,
}) {
```

Just before the `return (`, compute the spec:

```jsx
  const chartSpec = useMemo(() => inferChartSpec(data, chart), [data, chart])
```

In the JSX, insert the chart block immediately **before** the existing table block (the `{done && type === 'table' && data?.length > 0 && (...)}` at lines 101–105):

```jsx
      {done && chartSpec && <ChatChart data={data} spec={chartSpec} />}
```

- [ ] **Step 4: Forward `chart` through MessageBubble and MessageThread**

In `src/components/chat/MessageBubble.jsx`, add `chart` to the destructured props and pass it to `<AssistantMessage>`:

```jsx
export default function MessageBubble({
  role,
  content,
  targetContent,
  sql,
  data,
  type,
  chart,
  streaming,
  onRegenerate,
}) {
```

and in the `<AssistantMessage ... />` call add `chart={chart}` (next to `data={data}`).

In `src/components/chat/MessageThread.jsx`, in the `messages.map(...)` `<MessageBubble>` (lines 35–46), add:

```jsx
          chart={msg.chart}
```

- [ ] **Step 5: Store `chart` on the assistant message in ChatPanel**

In `src/components/chat/ChatPanel.jsx`, update the response destructure (line 50) and the pushed message (lines 51–62):

```jsx
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
```

(`suggestions` is stored now so Task 6 can use it.)

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run src/components/chat/AssistantMessage.test.jsx`
Expected: PASS (existing tests + 2 new ones).

- [ ] **Step 7: Commit**

```bash
git add src/components/chat/AssistantMessage.jsx src/components/chat/AssistantMessage.test.jsx src/components/chat/MessageBubble.jsx src/components/chat/MessageThread.jsx src/components/chat/ChatPanel.jsx
git commit -m "feat(chat): render inferred chart above the result table"
```

---

## Task 6: Suggested follow-up chips

**Files:**
- Modify: `src/components/chat/AssistantMessage.jsx`
- Modify: `src/components/chat/MessageBubble.jsx`
- Modify: `src/components/chat/MessageThread.jsx`
- Test: `src/components/chat/AssistantMessage.test.jsx`

- [ ] **Step 1: Write the failing tests**

Add to the `describe('AssistantMessage', ...)` block in `src/components/chat/AssistantMessage.test.jsx`:

```jsx
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/chat/AssistantMessage.test.jsx`
Expected: FAIL — the `Compare to 2010` button is not found.

- [ ] **Step 3: Render the chips in AssistantMessage**

In `src/components/chat/AssistantMessage.jsx`, add `suggestions` and `onSuggestion` to the destructured props:

```jsx
export default function AssistantMessage({
  content,
  targetContent,
  sql,
  data,
  type,
  chart,
  suggestions,
  streaming = false,
  onRegenerate,
  onSuggestion,
}) {
```

Insert this block in the JSX **after** the `{showActions && (...)}` actions block (after line 147, before the closing `</div>` of the root):

```jsx
      {done && onSuggestion && suggestions?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestion(s)}
              className="text-xs rounded-full border border-gray-200 bg-white px-3 py-1
                         text-gray-600 hover:border-brand-400 hover:bg-brand-50
                         transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
```

- [ ] **Step 4: Forward `suggestions`/`onSuggestion` through MessageBubble and MessageThread**

In `src/components/chat/MessageBubble.jsx`, add `suggestions` and `onSuggestion` to the destructured props and pass both to `<AssistantMessage>`:

```jsx
  suggestions,
  onSuggestion,
```

and in the `<AssistantMessage ... />` call add `suggestions={suggestions}` and `onSuggestion={onSuggestion}`.

In `src/components/chat/MessageThread.jsx`, in the `messages.map(...)` `<MessageBubble>`, add `suggestions` to every bubble and `onSuggestion` only to the last assistant bubble (mirroring how `onRegenerate` is gated):

```jsx
          suggestions={msg.suggestions}
          onSuggestion={i === lastAssistantIdx ? onSuggestion : undefined}
```

Then update the `MessageThread` function signature (lines 5–9) to accept `onSuggestion`:

```jsx
export default function MessageThread({
  messages,
  onSuggestion,
  onRegenerate,
}) {
```

`onSuggestion` is already passed from `ChatPanel` as `onSuggestion={sendMessage}` (it currently feeds `EmptyState`), so no `ChatPanel` change is needed — the same handler now also drives the chips.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run src/components/chat/AssistantMessage.test.jsx`
Expected: PASS (all AssistantMessage tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/chat/AssistantMessage.jsx src/components/chat/AssistantMessage.test.jsx src/components/chat/MessageBubble.jsx src/components/chat/MessageThread.jsx
git commit -m "feat(chat): show clickable follow-up suggestion chips on the latest answer"
```

---

## Task 7: Full suite + manual smoke test

**Files:** none (verification only)

- [ ] **Step 1: Run the full frontend suite**

Run: `npm test`
Expected: PASS — all suites green, including the existing chat tests and the new `chatChart`, `ChatChart`, and `AssistantMessage` tests.

- [ ] **Step 2: Run the full backend suite**

Run (from `backend/`): `python -m pytest -v`
Expected: PASS — all `test_pipeline.py` tests plus the existing `test_main.py`, `test_db.py`, `test_embeddings.py`.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors in the files touched (`chatChart.js`, `ChatChart.jsx`, `AssistantMessage.jsx`, `MessageBubble.jsx`, `MessageThread.jsx`, `ChatPanel.jsx`).

- [ ] **Step 4: Manual smoke test (requires backend running with a GROQ_API_KEY)**

Start the backend (`uvicorn main:app --reload` from `backend/`) and the frontend (`npm run dev`). Open the PSIA AI panel and ask:
- "Top 5 producers in 2022" → expect a bar chart above the table + 2–3 follow-up chips.
- "Aquaculture value trend for China" → expect a line chart.
- Click a follow-up chip → expect it to send as a new question.
- "How many countries are there?" → scalar answer, no chart, no chips.

If the backend is unavailable, the existing error path is unchanged (error bubble, no chart/chips) — confirm the chat still renders.

---

## Self-Review Notes

- **Spec coverage:** backend response shape (A.1) → Task 2; enrichment call + validation/fallback (A.2) → Tasks 1–2; hybrid `inferChartSpec` (A.3) → Task 3; `ChatChart` rendering above the table (A.4) → Tasks 4–5; suggestion chips on the last message (A.5) → Task 6. Scalar follow-ups are the documented deviation.
- **Cross-task type consistency:** the spec object `{ kind, x, y, series }` is identical across `inferChartSpec`, `ChatChart`, and the backend `_validate_chart` output. The response fields `chart` / `suggestions` are named consistently from `pipeline.run` → `ChatPanel` → `MessageThread` → `MessageBubble` → `AssistantMessage`.
- **Donut prop shape:** `ChatChart` maps rows to `{ label, value }` because `DonutChart` reads `dataKey="value"` / `nameKey="label"` (confirmed in source).
- **Hint vs heuristic:** a hint with a bad `x`/`y` falls through to the heuristic (tested); a hint with a bad `series` keeps the chart but nulls the series (tested).
```
