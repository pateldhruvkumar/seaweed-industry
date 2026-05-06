# Seaweed Industry Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Vite + React 18 data dashboard that presents all 17 EDA charts from the FAO seaweed notebook as interactive Plotly charts organized into 6 tabs, powered by pre-processed static JSON.

**Architecture:** A Python script (`scripts/preprocess.py`) reads 4 source CSVs and writes 18 JSON files into `public/data/`. The React app fetches only the JSON needed for the active tab, filters client-side by a global year range stored in React context, and renders charts via `react-plotly.js`.

**Tech Stack:** Vite 5, React 18, react-plotly.js, Tailwind CSS 3, Vitest + React Testing Library, Python 3 + pandas (preprocessing only)

---

## File Map

| File | Purpose |
|------|---------|
| `scripts/preprocess.py` | Reads CSVs, writes 18 JSON files to `public/data/` |
| `scripts/test_preprocess.py` | Verifies JSON shape/types after running preprocessor |
| `src/context/YearContext.jsx` | Global year range `[min, max]` in React context |
| `src/hooks/useData.js` | Fetch + in-memory cache for JSON files |
| `src/utils/formatters.js` | Pure formatting helpers: Mt, USD, %, kt |
| `src/lib/Plot.jsx` | Re-exports `react-plotly.js` default (single import point) |
| `src/components/layout/Header.jsx` | Dark header with title + global year range slider |
| `src/components/layout/TabNav.jsx` | 6-tab pill navigation |
| `src/components/ChartCard.jsx` | Card wrapper: title, optional controls slot, children |
| `src/components/charts/AreaChart.jsx` | Generic stacked area (Plotly) |
| `src/components/charts/BarChart.jsx` | Generic horizontal bar (Plotly) |
| `src/components/charts/LineChart.jsx` | Single or multi-line chart (Plotly) |
| `src/components/charts/ScatterChart.jsx` | Log-log scatter with labels (Plotly) |
| `src/components/charts/Heatmap.jsx` | Country × species heatmap (Plotly) |
| `src/components/controls/YearRangeSlider.jsx` | Two `<input type="range">` for year selection |
| `src/components/controls/Dropdown.jsx` | Single-select `<select>` |
| `src/components/controls/MultiSelect.jsx` | Multi-select `<select multiple>` |
| `src/components/DataTable.jsx` | Sortable, paginated table |
| `src/tabs/OverviewTab.jsx` | 3 charts: stacked production, aquaculture share %, capture vs aquaculture |
| `src/tabs/CountriesTab.jsx` | 2 charts: top-N bar, country time series |
| `src/tabs/RegionsTab.jsx` | 2 charts: by continent, by income group |
| `src/tabs/SpeciesTab.jsx` | 4 charts: species bar, heatmap, env quantity, env share |
| `src/tabs/EconomicsTab.jsx` | 3 charts + 1 table: price trend, price by env, scatter, species value table |
| `src/tabs/DataQualityTab.jsx` | 3 charts + 1 table: status flags, histograms, records/yr, quality summary |
| `src/App.jsx` | Tab router + `YearProvider` wrapper |
| `src/main.jsx` | Vite entry point |
| `src/index.css` | Tailwind directives |
| `src/test/setup.js` | Vitest setup: jest-dom + mock react-plotly.js |
| `vite.config.js` | Vite + Vitest config |
| `tailwind.config.js` | Tailwind content paths |
| `postcss.config.js` | PostCSS: tailwindcss + autoprefixer |

---

## Task 1: Scaffold Vite + React project

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/main.jsx`
- Create: `src/index.css`
- Create: `src/test/setup.js`
- Create: `index.html`

- [ ] **Step 1: Initialise project with npm**

```bash
cd D:/github/seaweed-industry
npm create vite@latest . -- --template react
```

When prompted "Current directory is not empty. Remove existing files and continue?" answer **y**.
When prompted for framework: **React**, variant: **JavaScript**.

- [ ] **Step 2: Install all dependencies**

```bash
npm install react-plotly.js plotly.js
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitejs/plugin-react
npx tailwindcss init -p
```

- [ ] **Step 3: Replace `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 4: Replace `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 5: Replace `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Create `src/test/setup.js`**

```js
import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('react-plotly.js', () => ({
  default: () => null,
}))
```

- [ ] **Step 7: Replace `src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 8: Create placeholder `src/App.jsx`**

```jsx
export default function App() {
  return <div className="p-8 text-2xl font-bold text-teal-800">Seaweed Dashboard — loading…</div>
}
```

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite prints a local URL (e.g. `http://localhost:5173`). Opening it shows "Seaweed Dashboard — loading…" in teal text. No console errors.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + Tailwind project"
```

---

## Task 2: Formatters utility

**Files:**
- Create: `src/utils/formatters.js`
- Create: `src/utils/formatters.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// src/utils/formatters.test.js
import { describe, it, expect } from 'vitest'
import { formatMt, formatUSD, formatPct, formatKt } from './formatters'

describe('formatMt', () => {
  it('formats value to 2 dp with Mt suffix', () => {
    expect(formatMt(12.3456)).toBe('12.35 Mt')
  })
  it('returns dash for null', () => {
    expect(formatMt(null)).toBe('—')
  })
  it('returns dash for undefined', () => {
    expect(formatMt(undefined)).toBe('—')
  })
})

describe('formatUSD', () => {
  it('formats integer with dollar sign and commas', () => {
    expect(formatUSD(1234)).toBe('$1,234')
  })
  it('rounds decimals', () => {
    expect(formatUSD(1234.7)).toBe('$1,235')
  })
  it('returns dash for null', () => {
    expect(formatUSD(null)).toBe('—')
  })
})

describe('formatPct', () => {
  it('formats value to 1 dp with % suffix', () => {
    expect(formatPct(42.567)).toBe('42.6%')
  })
  it('returns dash for null', () => {
    expect(formatPct(null)).toBe('—')
  })
})

describe('formatKt', () => {
  it('formats value with kt suffix', () => {
    expect(formatKt(3456.78)).toBe('3,457 kt')
  })
  it('returns dash for null', () => {
    expect(formatKt(null)).toBe('—')
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npx vitest run src/utils/formatters.test.js
```

Expected: FAIL — `formatMt` not defined.

- [ ] **Step 3: Implement `src/utils/formatters.js`**

```js
export const formatMt = v =>
  v == null ? '—' : `${Number(v).toFixed(2)} Mt`

export const formatUSD = v =>
  v == null ? '—' : `$${Math.round(Number(v)).toLocaleString('en-US')}`

export const formatPct = v =>
  v == null ? '—' : `${Number(v).toFixed(1)}%`

export const formatKt = v =>
  v == null ? '—' : `${Math.round(Number(v)).toLocaleString('en-US')} kt`
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npx vitest run src/utils/formatters.test.js
```

Expected: 4 suites, 11 tests — all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/formatters.js src/utils/formatters.test.js
git commit -m "feat: add formatters utility with tests"
```

---

## Task 3: Year context + useData hook

**Files:**
- Create: `src/context/YearContext.jsx`
- Create: `src/hooks/useData.js`
- Create: `src/hooks/useData.test.jsx`

- [ ] **Step 1: Write failing test for useData**

```jsx
// src/hooks/useData.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useData } from './useData'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useData', () => {
  it('returns loading true initially', () => {
    global.fetch = vi.fn(() => new Promise(() => {}))
    const { result } = renderHook(() => useData('test.json'))
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
  })

  it('returns parsed data after fetch resolves', async () => {
    const mockData = [{ year: 2020, value: 1.5 }]
    global.fetch = vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve(mockData) })
    )
    const { result } = renderHook(() => useData('test2.json'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('returns error string when fetch rejects', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('network fail')))
    const { result } = renderHook(() => useData('bad.json'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('network fail')
    expect(result.current.data).toBeNull()
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

```bash
npx vitest run src/hooks/useData.test.jsx
```

Expected: FAIL — `useData` not defined.

- [ ] **Step 3: Create `src/context/YearContext.jsx`**

```jsx
import { createContext, useContext, useState } from 'react'

const YearContext = createContext()

export function YearProvider({ children }) {
  const [yearRange, setYearRange] = useState([1950, 2024])
  return (
    <YearContext.Provider value={{ yearRange, setYearRange }}>
      {children}
    </YearContext.Provider>
  )
}

export const useYear = () => useContext(YearContext)
```

- [ ] **Step 4: Create `src/hooks/useData.js`**

```js
import { useState, useEffect } from 'react'

const cache = {}

export function useData(filename) {
  const [data, setData] = useState(cache[filename] ?? null)
  const [loading, setLoading] = useState(!cache[filename])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cache[filename]) {
      setData(cache[filename])
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/data/${filename}`)
      .then(r => r.json())
      .then(d => {
        cache[filename] = d
        setData(d)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [filename])

  return { data, loading, error }
}
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
npx vitest run src/hooks/useData.test.jsx
```

Expected: 3 tests — all PASS.

- [ ] **Step 6: Commit**

```bash
git add src/context/YearContext.jsx src/hooks/useData.js src/hooks/useData.test.jsx
git commit -m "feat: add YearContext and useData hook with tests"
```

---

## Task 4: Python preprocessor

**Files:**
- Create: `scripts/preprocess.py`
- Create: `scripts/test_preprocess.py`
- Create: `public/data/` (directory — created by script)

- [ ] **Step 1: Create `scripts/preprocess.py`**

```python
import pandas as pd
import numpy as np
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / 'dataset'
OUT_DIR  = Path(__file__).parent.parent / 'public' / 'data'
OUT_DIR.mkdir(parents=True, exist_ok=True)

STATUS_MAP = {
    'A': 'Official', 'E': 'Estimate', 'I': 'FAO inferred',
    'N': 'Not separately available', 'Q': 'Approximate',
}
ENV_MAP    = {'MA': 'Marine', 'BW': 'Brackish water', 'IN': 'Inland/freshwater'}
SOURCE_MAP = {
    'CAPTURE': 'Capture (wild)',
    'MARINE': 'Aquaculture - marine',
    'BRACKISHWATER': 'Aquaculture - brackish',
    'FRESHWATER': 'Aquaculture - freshwater',
}

print('Loading CSVs...')
aqua_qty   = pd.read_csv(DATA_DIR / 'seaweed_aquaculture_quantity.csv')
aqua_val   = pd.read_csv(DATA_DIR / 'seaweed_aquaculture_value.csv')
capture    = pd.read_csv(DATA_DIR / 'seaweed_capture_quantity.csv')
production = pd.read_csv(DATA_DIR / 'seaweed_global_production.csv')

for df in [aqua_qty, aqua_val, capture, production]:
    df['STATUS_LABEL'] = df['STATUS'].map(STATUS_MAP)
    if 'ENVIRONMENT.ALPHA_2_CODE' in df.columns:
        df['ENVIRONMENT_LABEL'] = df['ENVIRONMENT.ALPHA_2_CODE'].map(ENV_MAP)
    if 'PRODUCTION_SOURCE_DET.CODE' in df.columns:
        df['SOURCE_LABEL'] = df['PRODUCTION_SOURCE_DET.CODE'].map(SOURCE_MAP)


def _safe(x):
    if isinstance(x, float) and np.isnan(x):
        return None
    if isinstance(x, (np.integer,)):
        return int(x)
    if isinstance(x, (np.floating,)):
        return float(x)
    return x


def write_json(obj, filename):
    path = OUT_DIR / filename
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, separators=(',', ':'), default=_safe)
    count = len(obj) if isinstance(obj, list) else 'obj'
    size  = path.stat().st_size / 1024
    print(f'  {filename:<48} {str(count):>8}  {size:>7.1f} KB')


print('\nGenerating JSON files:')

# ── 1. global_production_by_source.json ──────────────────────────────────────
df = production.groupby(['PERIOD', 'SOURCE_LABEL'])['VALUE'].sum().reset_index()
write_json(
    [{'year': int(r.PERIOD), 'source': r.SOURCE_LABEL, 'value_mt': round(r.VALUE / 1e6, 4)}
     for _, r in df.iterrows() if pd.notna(r.SOURCE_LABEL)],
    'global_production_by_source.json',
)

# ── 2. aquaculture_share.json ─────────────────────────────────────────────────
total_yr = production.groupby('PERIOD')['VALUE'].sum()
aqua_yr  = production[production['SOURCE_LABEL'] != 'Capture (wild)'].groupby('PERIOD')['VALUE'].sum()
share    = (aqua_yr / total_yr * 100).dropna()
write_json(
    [{'year': int(y), 'share_pct': round(float(v), 2)} for y, v in share.items()],
    'aquaculture_share.json',
)

# ── 3. capture_vs_aquaculture.json ────────────────────────────────────────────
cap_yr  = capture.groupby('PERIOD')['VALUE'].sum().div(1e6)
aqua_yr = aqua_qty.groupby('PERIOD')['VALUE'].sum().div(1e6)
years   = sorted(set(cap_yr.index) | set(aqua_yr.index))
write_json(
    [{'year': int(y),
      'capture_mt':    round(float(cap_yr.get(y, 0)), 4),
      'aquaculture_mt': round(float(aqua_yr.get(y, 0)), 4)}
     for y in years],
    'capture_vs_aquaculture.json',
)

# ── 4. country_totals.json ────────────────────────────────────────────────────
max_yr  = int(production['PERIOD'].max())
windows = [
    (max_yr - 4,  max_yr),
    (max_yr - 9,  max_yr - 5),
    (max_yr - 14, max_yr - 10),
    (2000, 2004),
    (1990, 1994),
    (1970, 1974),
]
rows = []
for yr_s, yr_e in windows:
    df = production[production['PERIOD'].between(yr_s, yr_e)]
    totals = df.groupby('Country_Name')['VALUE'].sum().div(5).div(1e6)
    for country, val in totals.items():
        rows.append({'country': country, 'year_start': yr_s, 'year_end': yr_e,
                     'avg_tonnes_mt': round(float(val), 4)})
write_json(rows, 'country_totals.json')

# ── 5. country_timeseries.json ────────────────────────────────────────────────
df = production.groupby(['PERIOD', 'Country_Name'])['VALUE'].sum().reset_index()
write_json(
    [{'year': int(r.PERIOD), 'country': r.Country_Name, 'value_mt': round(r.VALUE / 1e6, 4)}
     for _, r in df.iterrows()],
    'country_timeseries.json',
)

# ── 6. by_continent.json ──────────────────────────────────────────────────────
df = production.groupby(['PERIOD', 'Continent_Group_En'])['VALUE'].sum().reset_index()
write_json(
    [{'year': int(r.PERIOD), 'continent': r.Continent_Group_En, 'value_mt': round(r.VALUE / 1e6, 4)}
     for _, r in df.iterrows() if pd.notna(r.Continent_Group_En)],
    'by_continent.json',
)

# ── 7. by_income_group.json ───────────────────────────────────────────────────
df = production.groupby(['PERIOD', 'EcoClass_Group_En'])['VALUE'].sum().reset_index()
write_json(
    [{'year': int(r.PERIOD), 'income_group': r.EcoClass_Group_En, 'value_mt': round(r.VALUE / 1e6, 4)}
     for _, r in df.iterrows() if pd.notna(r.EcoClass_Group_En)],
    'by_income_group.json',
)

# ── 8. species_totals.json ────────────────────────────────────────────────────
rows = []
for yr_s, yr_e in windows:
    df = production[production['PERIOD'].between(yr_s, yr_e)]
    totals = df.groupby('Seaweed_Name')['VALUE'].sum().div(5).div(1e6)
    for species, val in totals.items():
        if pd.notna(species):
            rows.append({'species': species, 'year_start': yr_s, 'year_end': yr_e,
                         'avg_tonnes_mt': round(float(val), 4)})
write_json(rows, 'species_totals.json')

# ── 9. country_species_matrix.json ───────────────────────────────────────────
recent = production[production['PERIOD'].between(max_yr - 4, max_yr)]
c_order = recent.groupby('Country_Name')['VALUE'].sum().sort_values(ascending=False).head(10).index.tolist()
s_order = recent.groupby('Seaweed_Name')['VALUE'].sum().sort_values(ascending=False).head(10).index.tolist()
s_order = [s for s in s_order if pd.notna(s)]
mat = (recent[recent['Country_Name'].isin(c_order) & recent['Seaweed_Name'].isin(s_order)]
       .groupby(['Country_Name', 'Seaweed_Name'])['VALUE'].sum().div(5).div(1e3)
       .unstack(fill_value=0)
       .reindex(index=c_order, columns=s_order, fill_value=0))
write_json(
    {'countries': c_order, 'species': s_order,
     'values': [[round(float(v), 1) for v in row] for row in mat.values.tolist()]},
    'country_species_matrix.json',
)

# ── 10. env_quantity.json ─────────────────────────────────────────────────────
df = aqua_qty.groupby(['PERIOD', 'ENVIRONMENT_LABEL'])['VALUE'].sum().reset_index()
write_json(
    [{'year': int(r.PERIOD), 'environment': r.ENVIRONMENT_LABEL, 'value_mt': round(r.VALUE / 1e6, 4)}
     for _, r in df.iterrows() if pd.notna(r.ENVIRONMENT_LABEL)],
    'env_quantity.json',
)

# ── 11. env_share.json ────────────────────────────────────────────────────────
pivot  = aqua_qty.groupby(['PERIOD', 'ENVIRONMENT_LABEL'])['VALUE'].sum().unstack(fill_value=0)
pshare = pivot.div(pivot.sum(axis=1), axis=0) * 100
rows = []
for year, row in pshare.iterrows():
    for env, pct in row.items():
        if pd.notna(env):
            rows.append({'year': int(year), 'environment': env, 'share_pct': round(float(pct), 2)})
write_json(rows, 'env_share.json')

# ── 12–13. price JSON files ───────────────────────────────────────────────────
join_keys = ['COUNTRY.UN_CODE', 'SPECIES.ALPHA_3_CODE', 'AREA.CODE',
             'ENVIRONMENT.ALPHA_2_CODE', 'PERIOD']
merged = aqua_val.merge(
    aqua_qty[join_keys + ['VALUE']].rename(columns={'VALUE': 'QUANTITY_TONNES'}),
    on=join_keys, how='inner',
)
merged.rename(columns={'VALUE': 'VALUE_USD_1000'}, inplace=True)

pg = (merged.groupby('PERIOD')
      .apply(lambda g: (g['VALUE_USD_1000'].sum() * 1000) / g['QUANTITY_TONNES'].sum()
             if g['QUANTITY_TONNES'].sum() > 0 else None, include_groups=False)
      .dropna())
write_json(
    [{'year': int(y), 'usd_per_tonne': round(float(v), 2)} for y, v in pg.items()],
    'price_global.json',
)

pe = (merged.groupby(['PERIOD', 'ENVIRONMENT_LABEL'])
      .apply(lambda g: (g['VALUE_USD_1000'].sum() * 1000) / g['QUANTITY_TONNES'].sum()
             if g['QUANTITY_TONNES'].sum() > 0 else None, include_groups=False)
      .reset_index().rename(columns={0: 'usd_per_tonne'})
      .dropna(subset=['usd_per_tonne']))
write_json(
    [{'year': int(r.PERIOD), 'environment': r.ENVIRONMENT_LABEL,
      'usd_per_tonne': round(float(r.usd_per_tonne), 2)}
     for _, r in pe.iterrows() if pd.notna(r.ENVIRONMENT_LABEL)],
    'price_by_env.json',
)

# ── 14. country_value_volume.json ─────────────────────────────────────────────
rows = []
for yr_s, yr_e in windows[:3]:
    df = merged[merged['PERIOD'].between(yr_s, yr_e)]
    agg = df.groupby('Country_Name').agg(
        tonnes=('QUANTITY_TONNES', 'sum'),
        value_kusd=('VALUE_USD_1000', 'sum'),
    ).div(yr_e - yr_s + 1)
    for country, r in agg.iterrows():
        if r.tonnes > 100:
            rows.append({
                'country': country, 'year_start': yr_s, 'year_end': yr_e,
                'avg_tonnes': round(float(r.tonnes), 1),
                'avg_value_musd': round(float(r.value_kusd) / 1000, 3),
                'usd_per_tonne': round(float(r.value_kusd) * 1000 / r.tonnes, 1)
                                 if r.tonnes > 0 else None,
            })
write_json(rows, 'country_value_volume.json')

# ── 15. species_price_table.json ──────────────────────────────────────────────
rows = []
for yr in sorted(merged['PERIOD'].unique(), reverse=True):
    df = merged[merged['PERIOD'] == yr]
    agg = (df.groupby('Seaweed_Name')
           .apply(lambda g: pd.Series({
               'tonnes':       g['QUANTITY_TONNES'].sum(),
               'value_kusd':   g['VALUE_USD_1000'].sum(),
               'usd_per_tonne': (g['VALUE_USD_1000'].sum() * 1000 / g['QUANTITY_TONNES'].sum()
                                 if g['QUANTITY_TONNES'].sum() > 0 else None),
           }), include_groups=False)
           .query('tonnes > 100')
           .reset_index())
    for _, r in agg.iterrows():
        if pd.notna(r.Seaweed_Name):
            rows.append({
                'year': int(yr), 'species': r.Seaweed_Name,
                'tonnes': round(float(r.tonnes), 1),
                'value_kusd': round(float(r.value_kusd), 1),
                'usd_per_tonne': round(float(r.usd_per_tonne), 1)
                                 if r.usd_per_tonne is not None else None,
            })
write_json(rows, 'species_price_table.json')

# ── 16. status_distribution.json ─────────────────────────────────────────────
ds_map = {
    'global_production': production,
    'aquaculture_quantity': aqua_qty,
    'aquaculture_value': aqua_val,
    'capture_quantity': capture,
}
status_dist = {}
for name, df in ds_map.items():
    counts = df['STATUS_LABEL'].value_counts(normalize=True).mul(100).round(1)
    status_dist[name] = [{'status': k, 'pct': float(v)} for k, v in counts.items()]
write_json(status_dist, 'status_distribution.json')

# ── 17. value_distribution.json ──────────────────────────────────────────────
val_dist = {}
for name, df in ds_map.items():
    s = np.log10(df['VALUE'].replace(0, np.nan).dropna())
    counts, edges = np.histogram(s, bins=50)
    val_dist[name] = [
        {'bin_start': round(float(edges[i]), 3),
         'bin_end':   round(float(edges[i + 1]), 3),
         'count':     int(counts[i])}
        for i in range(len(counts))
    ]
write_json(val_dist, 'value_distribution.json')

# ── 18. records_per_year.json ─────────────────────────────────────────────────
rec_rows = []
for name, df in ds_map.items():
    for year, count in df.groupby('PERIOD').size().items():
        rec_rows.append({'year': int(year), 'dataset': name, 'count': int(count)})

quality_summary = {}
for name, df in ds_map.items():
    quality_summary[name] = {
        'rows':               int(len(df)),
        'cols':               int(df.shape[1]),
        'null_cells_total':   int(df.isna().sum().sum()),
        'rows_with_any_null': int(df.isna().any(axis=1).sum()),
        'value_zeros':        int((df['VALUE'] == 0).sum()),
        'value_nulls':        int(df['VALUE'].isna().sum()),
        'duplicate_rows':     int(df.duplicated().sum()),
    }

write_json({'records': rec_rows, 'quality_summary': quality_summary}, 'records_per_year.json')

print(f'\nDone — all JSON files written to {OUT_DIR}')
```

- [ ] **Step 2: Run the preprocessor**

```bash
cd D:/github/seaweed-industry
python scripts/preprocess.py
```

Expected output: 18 lines each showing filename, row count, and file size. No errors. A `public/data/` directory is created containing 18 `.json` files.

- [ ] **Step 3: Write shape-verification tests**

```python
# scripts/test_preprocess.py
import json, pytest
from pathlib import Path

DATA = Path(__file__).parent.parent / 'public' / 'data'

def load(f):
    return json.loads((DATA / f).read_text())

def test_global_production_shape():
    data = load('global_production_by_source.json')
    assert isinstance(data, list) and len(data) > 0
    r = data[0]
    assert {'year', 'source', 'value_mt'} <= r.keys()
    assert isinstance(r['year'], int)
    assert isinstance(r['value_mt'], float)

def test_aquaculture_share_range():
    data = load('aquaculture_share.json')
    for r in data:
        assert 0 <= r['share_pct'] <= 100

def test_capture_vs_aquaculture_both_keys():
    data = load('capture_vs_aquaculture.json')
    r = data[0]
    assert 'capture_mt' in r and 'aquaculture_mt' in r

def test_country_species_matrix_shape():
    data = load('country_species_matrix.json')
    assert 'countries' in data and 'species' in data and 'values' in data
    assert len(data['values']) == len(data['countries'])
    assert len(data['values'][0]) == len(data['species'])

def test_records_per_year_structure():
    data = load('records_per_year.json')
    assert 'records' in data and 'quality_summary' in data
    assert len(data['records']) > 0
    assert 'global_production' in data['quality_summary']

def test_status_distribution_datasets():
    data = load('status_distribution.json')
    for key in ['global_production', 'aquaculture_quantity', 'aquaculture_value', 'capture_quantity']:
        assert key in data
        assert sum(r['pct'] for r in data[key]) == pytest.approx(100, abs=1)

def test_all_18_files_exist():
    expected = [
        'global_production_by_source.json', 'aquaculture_share.json',
        'capture_vs_aquaculture.json', 'country_totals.json',
        'country_timeseries.json', 'by_continent.json', 'by_income_group.json',
        'species_totals.json', 'country_species_matrix.json', 'env_quantity.json',
        'env_share.json', 'price_global.json', 'price_by_env.json',
        'country_value_volume.json', 'species_price_table.json',
        'status_distribution.json', 'value_distribution.json', 'records_per_year.json',
    ]
    for f in expected:
        assert (DATA / f).exists(), f'{f} missing'
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd D:/github/seaweed-industry
python -m pytest scripts/test_preprocess.py -v
```

Expected: 7 tests — all PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/ public/data/
git commit -m "feat: add preprocessor script and verify 18 JSON outputs"
```

---

## Task 5: Chart components

**Files:**
- Create: `src/components/charts/AreaChart.jsx`
- Create: `src/components/charts/BarChart.jsx`
- Create: `src/components/charts/LineChart.jsx`
- Create: `src/components/charts/ScatterChart.jsx`
- Create: `src/components/charts/Heatmap.jsx`

- [ ] **Step 1: Create `src/components/charts/AreaChart.jsx`**

```jsx
import Plot from 'react-plotly.js'

export default function AreaChart({ data, groupKey, valueKey, yLabel = '', height = 400 }) {
  if (!data?.length) return <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
  const groups = [...new Set(data.map(d => d[groupKey]))].filter(Boolean)
  const years  = [...new Set(data.map(d => d.year))].sort((a, b) => a - b)
  const lookup = Object.fromEntries(data.map(d => [`${d.year}__${d[groupKey]}`, d[valueKey]]))
  const traces = groups.map(g => ({
    x: years,
    y: years.map(y => lookup[`${y}__${g}`] ?? 0),
    name: g,
    type: 'scatter',
    mode: 'none',
    fill: 'tonexty',
    stackgroup: 'one',
  }))
  return (
    <Plot
      data={traces}
      layout={{
        yaxis: { title: yLabel, fixedrange: false },
        xaxis: { title: 'Year' },
        template: 'plotly_white',
        autosize: true,
        margin: { t: 10, r: 10, b: 50, l: 65 },
        legend: { orientation: 'h', y: -0.2 },
      }}
      useResizeHandler
      style={{ width: '100%', height: `${height}px` }}
      config={{ responsive: true, displaylogo: false }}
    />
  )
}
```

- [ ] **Step 2: Create `src/components/charts/BarChart.jsx`**

```jsx
import Plot from 'react-plotly.js'

export default function BarChart({ data, labelKey, valueKey, xLabel = '', height = 420 }) {
  if (!data?.length) return <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
  const sorted = [...data].sort((a, b) => a[valueKey] - b[valueKey])
  return (
    <Plot
      data={[{
        x: sorted.map(d => d[valueKey]),
        y: sorted.map(d => d[labelKey]),
        type: 'bar',
        orientation: 'h',
        marker: { color: '#0d9488' },
        text: sorted.map(d => Number(d[valueKey]).toFixed(2)),
        textposition: 'outside',
      }]}
      layout={{
        xaxis: { title: xLabel },
        template: 'plotly_white',
        autosize: true,
        margin: { t: 10, r: 80, b: 50, l: 160 },
      }}
      useResizeHandler
      style={{ width: '100%', height: `${height}px` }}
      config={{ responsive: true, displaylogo: false }}
    />
  )
}
```

- [ ] **Step 3: Create `src/components/charts/LineChart.jsx`**

```jsx
import Plot from 'react-plotly.js'

export default function LineChart({
  data, xKey = 'year', yKey, groupKey,
  yLabel = '', yLog = false, height = 380,
}) {
  if (!data?.length) return <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
  let traces
  if (groupKey) {
    const groups = [...new Set(data.map(d => d[groupKey]))].filter(Boolean)
    traces = groups.map(g => {
      const rows = data.filter(d => d[groupKey] === g).sort((a, b) => a[xKey] - b[xKey])
      return { x: rows.map(d => d[xKey]), y: rows.map(d => d[yKey]), name: g,
               type: 'scatter', mode: 'lines', line: { width: 2 } }
    })
  } else {
    const rows = [...data].sort((a, b) => a[xKey] - b[xKey])
    traces = [{ x: rows.map(d => d[xKey]), y: rows.map(d => d[yKey]),
                type: 'scatter', mode: 'lines', line: { width: 2.5, color: '#0d9488' } }]
  }
  return (
    <Plot
      data={traces}
      layout={{
        yaxis: { title: yLabel, type: yLog ? 'log' : 'linear', fixedrange: false },
        xaxis: { title: 'Year' },
        template: 'plotly_white',
        autosize: true,
        margin: { t: 10, r: 10, b: 50, l: 70 },
        legend: { orientation: 'h', y: -0.2 },
      }}
      useResizeHandler
      style={{ width: '100%', height: `${height}px` }}
      config={{ responsive: true, displaylogo: false }}
    />
  )
}
```

- [ ] **Step 4: Create `src/components/charts/ScatterChart.jsx`**

```jsx
import Plot from 'react-plotly.js'

export default function ScatterChart({ data, xKey, yKey, labelKey, xLabel = '', yLabel = '', height = 460 }) {
  if (!data?.length) return <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
  return (
    <Plot
      data={[{
        x: data.map(d => d[xKey]),
        y: data.map(d => d[yKey]),
        text: data.map(d => d[labelKey]),
        mode: 'markers+text',
        type: 'scatter',
        textposition: 'top right',
        textfont: { size: 9 },
        marker: { size: 8, color: '#1f77b4', opacity: 0.65, line: { width: 1, color: 'white' } },
      }]}
      layout={{
        xaxis: { title: xLabel, type: 'log' },
        yaxis: { title: yLabel, type: 'log' },
        template: 'plotly_white',
        autosize: true,
        margin: { t: 10, r: 10, b: 60, l: 70 },
      }}
      useResizeHandler
      style={{ width: '100%', height: `${height}px` }}
      config={{ responsive: true, displaylogo: false }}
    />
  )
}
```

- [ ] **Step 5: Create `src/components/charts/Heatmap.jsx`**

```jsx
import Plot from 'react-plotly.js'

export default function Heatmap({ data, height = 460 }) {
  if (!data) return <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
  const { countries, species, values } = data
  return (
    <Plot
      data={[{
        z: values,
        x: species,
        y: countries,
        type: 'heatmap',
        colorscale: 'YlGnBu',
        hoverongaps: false,
        text: values.map(row => row.map(v => v.toFixed(0))),
        texttemplate: '%{text}',
        colorbar: { title: 'K t/yr' },
      }]}
      layout={{
        xaxis: { title: 'Species / group', tickangle: -30 },
        yaxis: { title: 'Country', autorange: 'reversed' },
        template: 'plotly_white',
        autosize: true,
        margin: { t: 10, r: 20, b: 120, l: 150 },
      }}
      useResizeHandler
      style={{ width: '100%', height: `${height}px` }}
      config={{ responsive: true, displaylogo: false }}
    />
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/charts/
git commit -m "feat: add Plotly chart components (Area, Bar, Line, Scatter, Heatmap)"
```

---

## Task 6: Control components + ChartCard + DataTable

**Files:**
- Create: `src/components/controls/YearRangeSlider.jsx`
- Create: `src/components/controls/Dropdown.jsx`
- Create: `src/components/controls/MultiSelect.jsx`
- Create: `src/components/ChartCard.jsx`
- Create: `src/components/DataTable.jsx`

- [ ] **Step 1: Create `src/components/controls/YearRangeSlider.jsx`**

```jsx
export default function YearRangeSlider({ min, max, value, onChange }) {
  const [lo, hi] = value
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400 uppercase tracking-wide">Year</span>
      <input
        type="range" min={min} max={max} value={lo}
        onChange={e => onChange([Math.min(+e.target.value, hi - 1), hi])}
        className="w-24 accent-teal-600"
      />
      <span className="text-sm font-semibold text-gray-700 w-10 text-center">{lo}</span>
      <span className="text-gray-400">–</span>
      <input
        type="range" min={min} max={max} value={hi}
        onChange={e => onChange([lo, Math.max(+e.target.value, lo + 1)])}
        className="w-24 accent-teal-600"
      />
      <span className="text-sm font-semibold text-gray-700 w-10 text-center">{hi}</span>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/controls/Dropdown.jsx`**

```jsx
export default function Dropdown({ label, options, value, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      {label && <span className="text-xs text-gray-500 whitespace-nowrap">{label}</span>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border border-gray-200 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/controls/MultiSelect.jsx`**

```jsx
export default function MultiSelect({ label, options, value, onChange }) {
  return (
    <div className="flex items-start gap-1.5">
      {label && <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">{label}</span>}
      <select
        multiple
        value={value}
        onChange={e => onChange([...e.target.selectedOptions].map(o => o.value))}
        className="border border-gray-200 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-24 min-w-40"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/components/ChartCard.jsx`**

```jsx
export default function ChartCard({ title, controls, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <h3 className="font-semibold text-gray-800 text-sm leading-snug max-w-lg">{title}</h3>
        {controls && <div className="flex flex-wrap gap-3 items-center">{controls}</div>}
      </div>
      {children}
    </div>
  )
}
```

- [ ] **Step 5: Create `src/components/DataTable.jsx`**

```jsx
import { useState } from 'react'

export default function DataTable({ columns, data }) {
  const [sortKey, setSortKey] = useState(columns[0].key)
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage]       = useState(0)
  const PAGE = 15

  const sorted = [...(data ?? [])].sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey]
    if (va == null) return 1
    if (vb == null) return -1
    return sortDir === 'asc' ? va - vb : vb - va
  })
  const paged = sorted.slice(page * PAGE, (page + 1) * PAGE)

  const toggle = key => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggle(col.key)}
                  className="px-4 py-2.5 font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap border-b border-gray-100"
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1 text-teal-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-2 text-gray-800">
                    {col.format ? col.format(row[col.key]) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-2 px-1 text-xs text-gray-400">
        <span>{(data ?? []).length} rows</span>
        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="px-2 py-1 border rounded disabled:opacity-30 hover:bg-gray-50"
          >Prev</button>
          <span className="px-2 py-1">Page {page + 1}</span>
          <button
            disabled={(page + 1) * PAGE >= sorted.length}
            onClick={() => setPage(p => p + 1)}
            className="px-2 py-1 border rounded disabled:opacity-30 hover:bg-gray-50"
          >Next</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/
git commit -m "feat: add control components, ChartCard, and DataTable"
```

---

## Task 7: Layout components + App.jsx

**Files:**
- Create: `src/components/layout/Header.jsx`
- Create: `src/components/layout/TabNav.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create `src/components/layout/Header.jsx`**

```jsx
import { useYear } from '../../context/YearContext'
import YearRangeSlider from '../controls/YearRangeSlider'

export default function Header() {
  const { yearRange, setYearRange } = useYear()
  return (
    <header className="bg-teal-800 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Global Seaweed Industry</h1>
        <p className="text-teal-300 text-xs mt-0.5">FAO FishStat — Aquatic algae statistics (1950–2024)</p>
      </div>
      <YearRangeSlider min={1950} max={2024} value={yearRange} onChange={setYearRange} />
    </header>
  )
}
```

- [ ] **Step 2: Create `src/components/layout/TabNav.jsx`**

```jsx
const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'countries', label: 'Countries' },
  { id: 'regions',   label: 'Regions' },
  { id: 'species',   label: 'Species & Aquaculture' },
  { id: 'economics', label: 'Economics' },
  { id: 'quality',   label: 'Data Quality' },
]

export default function TabNav({ active, onChange }) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 sticky top-0 z-10">
      <div className="flex gap-0 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              active === tab.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Replace `src/App.jsx`**

```jsx
import { useState, Suspense, lazy } from 'react'
import { YearProvider } from './context/YearContext'
import Header from './components/layout/Header'
import TabNav from './components/layout/TabNav'

const OverviewTab    = lazy(() => import('./tabs/OverviewTab'))
const CountriesTab   = lazy(() => import('./tabs/CountriesTab'))
const RegionsTab     = lazy(() => import('./tabs/RegionsTab'))
const SpeciesTab     = lazy(() => import('./tabs/SpeciesTab'))
const EconomicsTab   = lazy(() => import('./tabs/EconomicsTab'))
const DataQualityTab = lazy(() => import('./tabs/DataQualityTab'))

const TAB_MAP = {
  overview:  OverviewTab,
  countries: CountriesTab,
  regions:   RegionsTab,
  species:   SpeciesTab,
  economics: EconomicsTab,
  quality:   DataQualityTab,
}

function Loading() {
  return <div className="p-12 text-center text-gray-400 text-sm">Loading…</div>
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const TabComponent = TAB_MAP[activeTab]
  return (
    <YearProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <TabNav active={activeTab} onChange={setActiveTab} />
        <main className="flex-1 p-6 max-w-screen-xl mx-auto w-full">
          <Suspense fallback={<Loading />}>
            <TabComponent />
          </Suspense>
        </main>
      </div>
    </YearProvider>
  )
}
```

- [ ] **Step 4: Create placeholder tab stubs** (so App.jsx resolves; replace in later tasks)

```bash
for tab in Overview Countries Regions Species Economics DataQuality; do
  echo "export default function ${tab}Tab() { return <div className='p-8 text-gray-400'>${tab} — coming soon</div> }" > "src/tabs/${tab}Tab.jsx"
done
```

- [ ] **Step 5: Verify dev server renders layout**

```bash
npm run dev
```

Open `http://localhost:5173`. Expected: dark teal header with year sliders, 6 tab buttons, placeholder text in content area. No console errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/ src/App.jsx src/tabs/
git commit -m "feat: add layout shell — header, tab nav, lazy-loaded tab routing"
```

---

## Task 8: OverviewTab

**Files:**
- Modify: `src/tabs/OverviewTab.jsx`

- [ ] **Step 1: Replace `src/tabs/OverviewTab.jsx`**

```jsx
import { useMemo } from 'react'
import { useYear } from '../context/YearContext'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import AreaChart from '../components/charts/AreaChart'
import LineChart from '../components/charts/LineChart'

export default function OverviewTab() {
  const { yearRange: [yMin, yMax] } = useYear()

  const { data: prodData,    loading: l1 } = useData('global_production_by_source.json')
  const { data: shareData,   loading: l2 } = useData('aquaculture_share.json')
  const { data: captureData, loading: l3 } = useData('capture_vs_aquaculture.json')

  const prod    = useMemo(() => prodData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [prodData, yMin, yMax])
  const share   = useMemo(() => shareData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [shareData, yMin, yMax])
  const cap     = useMemo(() => captureData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [captureData, yMin, yMax])

  if (l1 || l2 || l3) return <div className="p-12 text-center text-gray-400">Loading…</div>

  const capLinear = cap.flatMap(d => [
    { year: d.year, series: 'Capture',      value: d.capture_mt },
    { year: d.year, series: 'Aquaculture',  value: d.aquaculture_mt },
  ])

  return (
    <div className="space-y-6">
      <ChartCard title="Global seaweed production by source, 1950–2024 (million tonnes live weight)">
        <AreaChart data={prod} groupKey="source" valueKey="value_mt" yLabel="Million tonnes" />
      </ChartCard>

      <ChartCard title="Aquaculture as a share of global seaweed production (%)">
        <LineChart data={share} yKey="share_pct" yLabel="% of total tonnage" />
      </ChartCard>

      <ChartCard title="Capture vs. aquaculture — linear scale (million tonnes)">
        <LineChart data={capLinear} yKey="value" groupKey="series" yLabel="Million tonnes / year" />
      </ChartCard>

      <ChartCard title="Capture vs. aquaculture — log scale (reveals early aquaculture growth)">
        <LineChart data={capLinear} yKey="value" groupKey="series" yLabel="Million tonnes / year (log)" yLog />
      </ChartCard>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:5173`, click the **Overview** tab.  
Expected: 4 chart cards load. Stacked area shows growing aquaculture dominance. Dragging the year sliders in the header updates all charts. No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/tabs/OverviewTab.jsx
git commit -m "feat: implement OverviewTab (4 charts)"
```

---

## Task 9: CountriesTab

**Files:**
- Modify: `src/tabs/CountriesTab.jsx`

- [ ] **Step 1: Replace `src/tabs/CountriesTab.jsx`**

```jsx
import { useMemo, useState } from 'react'
import { useYear } from '../context/YearContext'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import BarChart from '../components/charts/BarChart'
import LineChart from '../components/charts/LineChart'
import Dropdown from '../components/controls/Dropdown'
import MultiSelect from '../components/controls/MultiSelect'

const WINDOW_OPTIONS = [
  { label: '2020–2024', value: '2020-2024' },
  { label: '2015–2019', value: '2015-2019' },
  { label: '2010–2014', value: '2010-2014' },
  { label: '2000–2004', value: '2000-2004' },
  { label: '1990–1994', value: '1990-1994' },
  { label: '1970–1974', value: '1970-1974' },
]

const TOP_N_OPTIONS = [
  { label: 'Top 10', value: '10' },
  { label: 'Top 15', value: '15' },
  { label: 'Top 20', value: '20' },
]

export default function CountriesTab() {
  const { yearRange: [yMin, yMax] } = useYear()
  const [window, setWindow]   = useState('2020-2024')
  const [topN, setTopN]       = useState('15')
  const [selected, setSelected] = useState([])

  const { data: totalsData, loading: l1 } = useData('country_totals.json')
  const { data: tsData,     loading: l2 } = useData('country_timeseries.json')

  const [winStart, winEnd] = window.split('-').map(Number)

  const barData = useMemo(() => {
    if (!totalsData) return []
    return totalsData
      .filter(d => d.year_start === winStart && d.year_end === winEnd)
      .sort((a, b) => b.avg_tonnes_mt - a.avg_tonnes_mt)
      .slice(0, +topN)
  }, [totalsData, winStart, winEnd, topN])

  const allCountries = useMemo(() =>
    [...new Set(tsData?.map(d => d.country) ?? [])].sort(),
    [tsData]
  )

  const defaultTop5 = useMemo(() => {
    if (!totalsData) return []
    return totalsData
      .filter(d => d.year_start === winStart && d.year_end === winEnd)
      .sort((a, b) => b.avg_tonnes_mt - a.avg_tonnes_mt)
      .slice(0, 5)
      .map(d => d.country)
  }, [totalsData, winStart, winEnd])

  const activeCountries = selected.length > 0 ? selected : defaultTop5

  const tsFiltered = useMemo(() =>
    tsData?.filter(d => activeCountries.includes(d.country) && d.year >= yMin && d.year <= yMax) ?? [],
    [tsData, activeCountries, yMin, yMax]
  )

  if (l1 || l2) return <div className="p-12 text-center text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      <ChartCard
        title={`Top ${topN} producing countries — ${winStart}–${winEnd} average (million tonnes/yr)`}
        controls={
          <>
            <Dropdown label="Window" options={WINDOW_OPTIONS} value={window} onChange={setWindow} />
            <Dropdown label="Show" options={TOP_N_OPTIONS} value={topN} onChange={setTopN} />
          </>
        }
      >
        <BarChart data={barData} labelKey="country" valueKey="avg_tonnes_mt" xLabel="Million tonnes / year" />
      </ChartCard>

      <ChartCard
        title="Production trajectory of selected countries (million tonnes / year)"
        controls={
          <MultiSelect
            label="Countries"
            options={allCountries}
            value={activeCountries}
            onChange={setSelected}
          />
        }
      >
        <LineChart data={tsFiltered} yKey="value_mt" groupKey="country" yLabel="Million tonnes / year" />
      </ChartCard>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Click the **Countries** tab.  
Expected: Top-15 horizontal bar for 2020–2024. Changing the window dropdown re-renders the bar. Multi-select lets you pick countries for the time series. Year sliders update the time series chart.

- [ ] **Step 3: Commit**

```bash
git add src/tabs/CountriesTab.jsx
git commit -m "feat: implement CountriesTab (bar + time series with dropdowns)"
```

---

## Task 10: RegionsTab

**Files:**
- Modify: `src/tabs/RegionsTab.jsx`

- [ ] **Step 1: Replace `src/tabs/RegionsTab.jsx`**

```jsx
import { useMemo } from 'react'
import { useYear } from '../context/YearContext'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import AreaChart from '../components/charts/AreaChart'

export default function RegionsTab() {
  const { yearRange: [yMin, yMax] } = useYear()

  const { data: contData,   loading: l1 } = useData('by_continent.json')
  const { data: incomeData, loading: l2 } = useData('by_income_group.json')

  const continent = useMemo(() => contData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [contData, yMin, yMax])
  const income    = useMemo(() => incomeData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [incomeData, yMin, yMax])

  if (l1 || l2) return <div className="p-12 text-center text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      <ChartCard title="Global seaweed production by continent (million tonnes)">
        <AreaChart data={continent} groupKey="continent" valueKey="value_mt" yLabel="Million tonnes" />
      </ChartCard>

      <ChartCard title="Global seaweed production by income group (million tonnes)">
        <AreaChart data={income} groupKey="income_group" valueKey="value_mt" yLabel="Million tonnes" />
      </ChartCard>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Click the **Regions** tab.  
Expected: Two stacked area charts. Asia dominates the continent view. Year sliders filter both charts.

- [ ] **Step 3: Commit**

```bash
git add src/tabs/RegionsTab.jsx
git commit -m "feat: implement RegionsTab (continent + income group area charts)"
```

---

## Task 11: SpeciesTab

**Files:**
- Modify: `src/tabs/SpeciesTab.jsx`

- [ ] **Step 1: Replace `src/tabs/SpeciesTab.jsx`**

```jsx
import { useMemo, useState } from 'react'
import { useYear } from '../context/YearContext'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import BarChart from '../components/charts/BarChart'
import Heatmap from '../components/charts/Heatmap'
import AreaChart from '../components/charts/AreaChart'
import Dropdown from '../components/controls/Dropdown'

const WINDOW_OPTIONS = [
  { label: '2020–2024', value: '2020-2024' },
  { label: '2015–2019', value: '2015-2019' },
  { label: '2010–2014', value: '2010-2014' },
  { label: '2000–2004', value: '2000-2004' },
  { label: '1990–1994', value: '1990-1994' },
]

const TOPN_OPTIONS = [
  { label: 'Top 5',  value: '5' },
  { label: 'Top 10', value: '10' },
  { label: 'Top 15', value: '15' },
]

export default function SpeciesTab() {
  const { yearRange: [yMin, yMax] } = useYear()
  const [speciesWindow, setSpeciesWindow] = useState('2020-2024')
  const [heatmapN, setHeatmapN]           = useState('10')

  const { data: speciesData, loading: l1 } = useData('species_totals.json')
  const { data: matrixData,  loading: l2 } = useData('country_species_matrix.json')
  const { data: envQtyData,  loading: l3 } = useData('env_quantity.json')
  const { data: envShareData,loading: l4 } = useData('env_share.json')

  const [wStart, wEnd] = speciesWindow.split('-').map(Number)

  const speciesBar = useMemo(() => {
    if (!speciesData) return []
    return speciesData
      .filter(d => d.year_start === wStart && d.year_end === wEnd)
      .sort((a, b) => b.avg_tonnes_mt - a.avg_tonnes_mt)
      .slice(0, 15)
  }, [speciesData, wStart, wEnd])

  const heatmap = useMemo(() => {
    if (!matrixData) return null
    const n = +heatmapN
    return {
      countries: matrixData.countries.slice(0, n),
      species:   matrixData.species.slice(0, n),
      values:    matrixData.values.slice(0, n).map(row => row.slice(0, n)),
    }
  }, [matrixData, heatmapN])

  const envQty   = useMemo(() => envQtyData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [envQtyData, yMin, yMax])
  const envShare = useMemo(() => envShareData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [envShareData, yMin, yMax])

  if (l1 || l2 || l3 || l4) return <div className="p-12 text-center text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      <ChartCard
        title="Top 15 species / groups by output (million tonnes / year)"
        controls={
          <Dropdown label="Period" options={WINDOW_OPTIONS} value={speciesWindow} onChange={setSpeciesWindow} />
        }
      >
        <BarChart data={speciesBar} labelKey="species" valueKey="avg_tonnes_mt" xLabel="Million tonnes / year" />
      </ChartCard>

      <ChartCard
        title="Country × species specialization — thousand tonnes / year"
        controls={
          <Dropdown label="Show top" options={TOPN_OPTIONS} value={heatmapN} onChange={setHeatmapN} />
        }
      >
        <Heatmap data={heatmap} />
      </ChartCard>

      <ChartCard title="Aquaculture quantity by environment (million tonnes / year)">
        <AreaChart data={envQty} groupKey="environment" valueKey="value_mt" yLabel="Million tonnes" />
      </ChartCard>

      <ChartCard title="Aquaculture environment share (%)">
        <AreaChart data={envShare} groupKey="environment" valueKey="share_pct" yLabel="% of aquaculture quantity" />
      </ChartCard>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Click the **Species & Aquaculture** tab.  
Expected: 4 chart cards. Heatmap shows country×species grid with annotation values. Top-N dropdown trims the heatmap. Species period dropdown updates the bar. No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/tabs/SpeciesTab.jsx
git commit -m "feat: implement SpeciesTab (species bar, heatmap, env area charts)"
```

---

## Task 12: EconomicsTab

**Files:**
- Modify: `src/tabs/EconomicsTab.jsx`

- [ ] **Step 1: Replace `src/tabs/EconomicsTab.jsx`**

```jsx
import { useMemo, useState } from 'react'
import { useYear } from '../context/YearContext'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import LineChart from '../components/charts/LineChart'
import ScatterChart from '../components/charts/ScatterChart'
import DataTable from '../components/DataTable'
import Dropdown from '../components/controls/Dropdown'
import { formatKt, formatUSD } from '../utils/formatters'

const WINDOW_OPTIONS = [
  { label: '2020–2024', value: '2020-2024' },
  { label: '2015–2019', value: '2015-2019' },
  { label: '2010–2014', value: '2010-2014' },
]

const TABLE_COLUMNS = [
  { key: 'species',       label: 'Species' },
  { key: 'tonnes',        label: 'Tonnes / yr',   format: v => formatKt(v / 1000) },
  { key: 'value_kusd',    label: 'Value (k USD)',  format: v => formatUSD(v * 1000) },
  { key: 'usd_per_tonne', label: 'USD / tonne',    format: v => formatUSD(v) },
]

export default function EconomicsTab() {
  const { yearRange: [yMin, yMax] } = useYear()
  const [scatterWindow, setScatterWindow] = useState('2020-2024')
  const [tableYear, setTableYear]         = useState(null)

  const { data: priceGlobal, loading: l1 } = useData('price_global.json')
  const { data: priceEnv,    loading: l2 } = useData('price_by_env.json')
  const { data: volVal,      loading: l3 } = useData('country_value_volume.json')
  const { data: specPrice,   loading: l4 } = useData('species_price_table.json')

  const pg = useMemo(() => priceGlobal?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [priceGlobal, yMin, yMax])
  const pe = useMemo(() => priceEnv?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [priceEnv, yMin, yMax])

  const [wStart, wEnd] = scatterWindow.split('-').map(Number)
  const scatter = useMemo(() =>
    volVal?.filter(d => d.year_start === wStart && d.year_end === wEnd) ?? [],
    [volVal, wStart, wEnd]
  )

  const availableYears = useMemo(() =>
    [...new Set(specPrice?.map(d => d.year) ?? [])].sort((a, b) => b - a),
    [specPrice]
  )
  const selectedYear = tableYear ?? availableYears[0] ?? null
  const tableData = useMemo(() =>
    specPrice?.filter(d => d.year === selectedYear) ?? [],
    [specPrice, selectedYear]
  )
  const yearOptions = useMemo(() =>
    availableYears.map(y => ({ label: String(y), value: String(y) })),
    [availableYears]
  )

  if (l1 || l2 || l3 || l4) return <div className="p-12 text-center text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      <ChartCard title="Global volume-weighted average aquaculture price (USD per tonne live weight)">
        <LineChart data={pg} yKey="usd_per_tonne" yLabel="USD per tonne" />
      </ChartCard>

      <ChartCard title="Average aquaculture price by farming environment (log scale, USD per tonne)">
        <LineChart data={pe} yKey="usd_per_tonne" groupKey="environment" yLabel="USD per tonne (log)" yLog />
      </ChartCard>

      <ChartCard
        title="Country positioning: average annual volume vs. value (log-log scale)"
        controls={
          <Dropdown label="Period" options={WINDOW_OPTIONS} value={scatterWindow} onChange={setScatterWindow} />
        }
      >
        <ScatterChart
          data={scatter}
          xKey="avg_tonnes"
          yKey="avg_value_musd"
          labelKey="country"
          xLabel="Average annual quantity (tonnes, log scale)"
          yLabel="Average annual value (million USD, log scale)"
        />
      </ChartCard>

      <ChartCard
        title="Highest-value species by implied unit price (USD per tonne)"
        controls={
          yearOptions.length > 0 && (
            <Dropdown
              label="Year"
              options={yearOptions}
              value={String(selectedYear)}
              onChange={v => setTableYear(+v)}
            />
          )
        }
      >
        <DataTable columns={TABLE_COLUMNS} data={tableData} />
      </ChartCard>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Click the **Economics** tab.  
Expected: Price trend line, log-scale environment price lines, log-log scatter with country labels, sortable species table with year filter. No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/tabs/EconomicsTab.jsx
git commit -m "feat: implement EconomicsTab (price charts, scatter, value table)"
```

---

## Task 13: DataQualityTab

**Files:**
- Modify: `src/tabs/DataQualityTab.jsx`

- [ ] **Step 1: Replace `src/tabs/DataQualityTab.jsx`**

```jsx
import { useMemo } from 'react'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import DataTable from '../components/DataTable'
import Plot from 'react-plotly.js'

const DATASETS = ['global_production', 'aquaculture_quantity', 'aquaculture_value', 'capture_quantity']

function SmallBar({ title, records }) {
  if (!records?.length) return null
  return (
    <div className="flex-1 min-w-48">
      <p className="text-xs font-medium text-gray-500 mb-1 truncate">{title}</p>
      <Plot
        data={[{
          x: records.map(r => r.pct),
          y: records.map(r => r.status),
          type: 'bar',
          orientation: 'h',
          marker: { color: '#0d9488' },
          text: records.map(r => `${r.pct}%`),
          textposition: 'outside',
        }]}
        layout={{
          template: 'plotly_white',
          autosize: true,
          margin: { t: 5, r: 50, b: 30, l: 120 },
          xaxis: { title: '%', range: [0, 110] },
          yaxis: { autorange: 'reversed' },
        }}
        useResizeHandler
        style={{ width: '100%', height: '200px' }}
        config={{ displaylogo: false, displayModeBar: false }}
      />
    </div>
  )
}

function SmallHist({ title, bins }) {
  if (!bins?.length) return null
  return (
    <div className="flex-1 min-w-48">
      <p className="text-xs font-medium text-gray-500 mb-1 truncate">{title}</p>
      <Plot
        data={[{
          x: bins.map(b => (b.bin_start + b.bin_end) / 2),
          y: bins.map(b => b.count),
          type: 'bar',
          marker: { color: '#0f766e' },
          width: bins.map(b => b.bin_end - b.bin_start),
        }]}
        layout={{
          template: 'plotly_white',
          autosize: true,
          margin: { t: 5, r: 10, b: 30, l: 50 },
          xaxis: { title: 'log₁₀(VALUE)' },
          yaxis: { title: 'records' },
        }}
        useResizeHandler
        style={{ width: '100%', height: '200px' }}
        config={{ displaylogo: false, displayModeBar: false }}
      />
    </div>
  )
}

const QUALITY_COLS = [
  { key: 'dataset',           label: 'Dataset' },
  { key: 'rows',              label: 'Rows',             format: v => v?.toLocaleString() },
  { key: 'null_cells_total',  label: 'Null cells',       format: v => v?.toLocaleString() },
  { key: 'rows_with_any_null',label: 'Rows w/ nulls',    format: v => v?.toLocaleString() },
  { key: 'value_zeros',       label: 'VALUE = 0',        format: v => v?.toLocaleString() },
  { key: 'value_nulls',       label: 'VALUE nulls',      format: v => v?.toLocaleString() },
  { key: 'duplicate_rows',    label: 'Duplicates',       format: v => v?.toLocaleString() },
]

export default function DataQualityTab() {
  const { data: recData,  loading: l1 } = useData('records_per_year.json')
  const { data: statusData, loading: l2 } = useData('status_distribution.json')
  const { data: valDistData, loading: l3 } = useData('value_distribution.json')

  const recRows     = recData?.records ?? []
  const qualSummary = recData?.quality_summary ?? {}

  const qualityTableData = useMemo(() =>
    DATASETS.map(ds => ({ dataset: ds, ...(qualSummary[ds] ?? {}) })),
    [qualSummary]
  )

  const recTraces = useMemo(() => {
    if (!recRows.length) return []
    return DATASETS.map(ds => {
      const rows = recRows.filter(r => r.dataset === ds).sort((a, b) => a.year - b.year)
      return { x: rows.map(r => r.year), y: rows.map(r => r.count), name: ds,
               type: 'scatter', mode: 'lines', line: { width: 1.5 } }
    })
  }, [recRows])

  if (l1 || l2 || l3) return <div className="p-12 text-center text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      <ChartCard title="Data quality flag distribution per dataset (% of records)">
        <div className="flex flex-wrap gap-4">
          {DATASETS.map(ds => (
            <SmallBar key={ds} title={ds} records={statusData?.[ds]} />
          ))}
        </div>
      </ChartCard>

      <ChartCard title="VALUE distribution on log₁₀ scale (non-zero records)">
        <div className="flex flex-wrap gap-4">
          {DATASETS.map(ds => (
            <SmallHist key={ds} title={ds} bins={valDistData?.[ds]} />
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Number of records reported per year, by dataset">
        <Plot
          data={recTraces}
          layout={{
            template: 'plotly_white',
            autosize: true,
            margin: { t: 10, r: 10, b: 50, l: 60 },
            xaxis: { title: 'Year' },
            yaxis: { title: 'Records' },
            legend: { orientation: 'h', y: -0.2 },
          }}
          useResizeHandler
          style={{ width: '100%', height: '360px' }}
          config={{ responsive: true, displaylogo: false }}
        />
      </ChartCard>

      <ChartCard title="Data quality summary">
        <DataTable columns={QUALITY_COLS} data={qualityTableData} />
      </ChartCard>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Click the **Data Quality** tab.  
Expected: 4 small bar charts (status flags), 4 small histograms (VALUE distribution), records/year multi-line, and quality summary table with 4 rows. No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/tabs/DataQualityTab.jsx
git commit -m "feat: implement DataQualityTab (status flags, histograms, records/yr, quality table)"
```

---

## Task 14: Final checks + build

**Files:** no new files

- [ ] **Step 1: Run all JS/TS tests**

```bash
npx vitest run
```

Expected: All tests pass (formatters + useData).

- [ ] **Step 2: Run Python tests**

```bash
python -m pytest scripts/test_preprocess.py -v
```

Expected: 7 tests pass.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: `dist/` directory created. No build errors. Bundle size printed (Plotly will be ~3 MB — this is expected for a local demo).

- [ ] **Step 4: Preview production build**

```bash
npm run preview
```

Open the printed URL. Click through all 6 tabs. Verify:
- All charts render with correct data
- Year range slider updates charts across all tabs
- Dropdowns and multiselects work
- DataTable sorts and paginates
- No console errors

- [ ] **Step 5: Add `.gitignore` entry for dist if not present**

```bash
grep -q "^dist" .gitignore || echo "dist/" >> .gitignore
```

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete seaweed industry dashboard — all 6 tabs, 17 charts"
```
