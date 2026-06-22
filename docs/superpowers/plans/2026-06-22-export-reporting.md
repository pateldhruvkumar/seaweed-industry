# Export / Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Export" control to every dashboard tab that downloads the current tab as a lightly-branded PDF, PowerPoint (.pptx), or Excel (.xlsx) — entirely client-side, no backend.

**Architecture:** A lazy-loaded `src/lib/export/` module. Images come from capturing what is rendered (Recharts SVG via `html-to-image`; the heatmap/EDA Plotly nodes via `Plotly.toImage`). Excel data comes from the source datasets the active tab loaded, read from the `useData` cache (no DOM scraping). A `useExport` hook drives an `ExportMenu` in the Topbar.

**Tech Stack:** React 18, Vite, Vitest, `jspdf`, `pptxgenjs`, `xlsx` (SheetJS), `html-to-image`, existing `plotly.js-dist-min`.

**Spec:** `docs/superpowers/specs/2026-06-22-export-reporting-design.md`

---

## File Structure

**Create**
- `src/lib/export/branding.js` — brand constants + `isoDate`, `exportFilename`, `sanitizeSheetName`, `loadImageDataUrl`
- `src/lib/export/captureTab.js` — `collectSources` (Phase 1) + `captureTab` image enumeration (Phase 2)
- `src/lib/export/toExcel.js` — `buildWorkbook` + `buildExcelBlob`
- `src/lib/export/toPdf.js` — `buildPdfBlob` (Phase 2)
- `src/lib/export/toPptx.js` — `buildPptxBlob` (Phase 3)
- `src/lib/export/index.js` — `exportTab` dispatch + `triggerDownload`
- `src/hooks/useExport.js` — export state machine
- `src/components/export/ExportMenu.jsx` — Topbar button + dropdown
- Test files alongside each (`*.test.js` / `*.test.jsx`)

**Modify**
- `package.json` — add 4 dependencies
- `src/hooks/useData.js` — `setActiveTab`, load attribution, `getTabDatasetFilenames`, `getCachedData`
- `src/components/layout/Topbar.jsx` — `actions` slot
- `src/App.jsx` — `#tab-content` wrapper, `setActiveTab`, render `ExportMenu`
- `src/components/SourceNote.jsx` — `data-export-source` marker
- `src/lib/icons.jsx` — add `IconDownload`
- `src/test/setup.js` — add `toImage` to the Plotly mock (Phase 2)

---

# PHASE 1 — Foundation + Excel

## Task 1: Add dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the four client-side libraries**

Run:
```bash
npm install jspdf pptxgenjs xlsx html-to-image
```
Expected: the four packages appear under `dependencies` in `package.json` and install without error.

- [ ] **Step 2: Verify the dev server still boots**

Run:
```bash
npx vite build
```
Expected: build completes with no missing-module errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add jspdf, pptxgenjs, xlsx, html-to-image for export feature"
```

---

## Task 2: Branding helpers

**Files:**
- Create: `src/lib/export/branding.js`
- Test: `src/lib/export/branding.test.js`

- [ ] **Step 1: Write the failing test**

`src/lib/export/branding.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { isoDate, exportFilename, sanitizeSheetName } from './branding'

describe('isoDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(isoDate(new Date(2026, 5, 22))).toBe('2026-06-22')
  })
})

describe('exportFilename', () => {
  it('builds seaweed-<slug>-<date>.<ext>', () => {
    expect(exportFilename('Canada · Economics', 'xlsx', new Date(2026, 5, 22)))
      .toBe('seaweed-canada-economics-2026-06-22.xlsx')
  })
  it('falls back to "dashboard" for empty titles', () => {
    expect(exportFilename('', 'pdf', new Date(2026, 5, 22)))
      .toBe('seaweed-dashboard-2026-06-22.pdf')
  })
})

describe('sanitizeSheetName', () => {
  it('strips illegal chars and truncates to 31', () => {
    const long = 'a/b:c'.padEnd(40, 'x')
    const out = sanitizeSheetName(long)
    expect(out.length).toBeLessThanOrEqual(31)
    expect(out).not.toMatch(/[:\\/?*[\]]/)
  })
  it('dedupes against names already used', () => {
    const used = new Set()
    const a = sanitizeSheetName('Sheet', used)
    const b = sanitizeSheetName('Sheet', used)
    expect(a).toBe('Sheet')
    expect(b).not.toBe('Sheet')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/export/branding.test.js`
Expected: FAIL — cannot resolve `./branding`.

- [ ] **Step 3: Write the implementation**

`src/lib/export/branding.js`:
```js
import { PLOT_COLORS } from '../chartTheme'
import psiaLogoUrl from '../../assets/psia-logo-white-green.png'

// Brand palette, mirroring chartTheme so exports match the dashboard.
export const BRAND_TEAL = PLOT_COLORS[0] // '#0d9488'
export const BRAND_TEAL_DARK = '#0f766e' // teal-700
export const INK = '#0f172a'             // slate-900
export const MUTED = '#64748b'           // slate-500
export const DASHBOARD_NAME = 'Seaweed Industry Dashboard'
export const DASHBOARD_URL = 'https://seaweed-industry.vercel.app'

export { psiaLogoUrl }

/** Local-time YYYY-MM-DD. */
export function isoDate(d = new Date()) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** seaweed-<slug>-<date>.<ext> */
export function exportFilename(tabTitle, ext, date = new Date()) {
  const slug =
    (tabTitle || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'dashboard'
  return `seaweed-${slug}-${isoDate(date)}.${ext}`
}

/** Excel sheet name: <= 31 chars, no : \ / ? * [ ], deduped against `used`. */
export function sanitizeSheetName(name, used = new Set()) {
  const base =
    (name || 'Sheet').replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31) || 'Sheet'
  let candidate = base
  let i = 2
  while (used.has(candidate)) {
    const suffix = ` (${i})`
    candidate = base.slice(0, 31 - suffix.length).trim() + suffix
    i += 1
  }
  used.add(candidate)
  return candidate
}

/** Fetch an image URL and resolve a base64 data URL (for jsPDF / pptxgenjs). */
export async function loadImageDataUrl(url) {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/export/branding.test.js`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/export/branding.js src/lib/export/branding.test.js
git commit -m "feat(export): add branding constants and filename/sheet helpers"
```

---

## Task 3: useData accessors + active-tab tracking

**Files:**
- Modify: `src/hooks/useData.js`
- Test: `src/hooks/useData.export.test.jsx`

- [ ] **Step 1: Write the failing test**

`src/hooks/useData.export.test.jsx`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  useData, setActiveTab, getTabDatasetFilenames, getCachedData,
} from './useData'

describe('useData export accessors', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ json: () => Promise.resolve([{ year: 2020, v: 1 }]) })),
    )
  })

  it('attributes loaded datasets to the active tab and caches them', async () => {
    setActiveTab('overview')
    const { result } = renderHook(() => useData('demo_dataset.json'))

    // Recorded synchronously when the effect runs.
    expect(getTabDatasetFilenames('overview')).toContain('demo_dataset.json')

    await waitFor(() => expect(result.current.data).not.toBeNull())
    expect(getCachedData('demo_dataset.json')).toEqual([{ year: 2020, v: 1 }])
  })

  it('returns [] for a tab with no loads and null for an unknown file', () => {
    expect(getTabDatasetFilenames('never-visited')).toEqual([])
    expect(getCachedData('nope.json')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useData.export.test.jsx`
Expected: FAIL — `setActiveTab`/`getTabDatasetFilenames`/`getCachedData` are not exported.

- [ ] **Step 3: Implement the accessors**

Replace the entire contents of `src/hooks/useData.js` with:
```js
import { useState, useEffect } from 'react'

const cache = {}
let activeTab = null
const tabDatasets = {} // { [tabId]: Set<filename> }

/** App calls this as the active tab changes so loads are attributed correctly. */
export function setActiveTab(id) {
  activeTab = id
}

function recordLoad(filename) {
  if (!activeTab) return
  if (!tabDatasets[activeTab]) tabDatasets[activeTab] = new Set()
  tabDatasets[activeTab].add(filename)
}

/** Filenames the given tab has loaded (in load order). */
export function getTabDatasetFilenames(id) {
  return tabDatasets[id] ? Array.from(tabDatasets[id]) : []
}

/** The cached JSON for a filename, or null. */
export function getCachedData(filename) {
  return cache[filename] ?? null
}

export function useData(filename) {
  const [data, setData] = useState(cache[filename] ?? null)
  const [loading, setLoading] = useState(!cache[filename])
  const [error, setError] = useState(null)

  useEffect(() => {
    recordLoad(filename)
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/hooks/useData.export.test.jsx src/hooks/useData.test.jsx`
Expected: PASS (new accessors + existing useData tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useData.js src/hooks/useData.export.test.jsx
git commit -m "feat(export): track datasets per tab and expose useData accessors"
```

---

## Task 4: collectSources helper

**Files:**
- Create: `src/lib/export/captureTab.js`
- Test: `src/lib/export/captureTab.test.js`

- [ ] **Step 1: Write the failing test**

`src/lib/export/captureTab.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { collectSources } from './captureTab'

describe('collectSources', () => {
  it('reads text from elements marked data-export-source, trimmed', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <p data-export-source>Source:  FAO   FishStat</p>
      <p>not a source</p>
      <p data-export-source>Statistics Canada, Table 32-10-0107</p>
    `
    expect(collectSources(root)).toEqual([
      'Source: FAO FishStat',
      'Statistics Canada, Table 32-10-0107',
    ])
  })

  it('returns [] when root is null', () => {
    expect(collectSources(null)).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/export/captureTab.test.js`
Expected: FAIL — cannot resolve `./captureTab`.

- [ ] **Step 3: Implement collectSources**

`src/lib/export/captureTab.js`:
```js
/**
 * Collect source/caveat citations marked with `data-export-source`.
 * Whitespace is collapsed so multi-line SourceNote markup reads as one line.
 */
export function collectSources(rootEl) {
  if (!rootEl) return []
  return Array.from(rootEl.querySelectorAll('[data-export-source]'))
    .map(el => el.textContent.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/export/captureTab.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/export/captureTab.js src/lib/export/captureTab.test.js
git commit -m "feat(export): add collectSources for data-export-source citations"
```

---

## Task 5: SourceNote marker

**Files:**
- Modify: `src/components/SourceNote.jsx`

- [ ] **Step 1: Add the marker attribute**

In `src/components/SourceNote.jsx`, change the root `<p>` opening tag:
```jsx
    <p className="mt-2 text-[11px] text-slate-400 leading-snug">
```
to:
```jsx
    <p data-export-source className="mt-2 text-[11px] text-slate-400 leading-snug">
```

- [ ] **Step 2: Verify existing tests still pass**

Run: `npx vitest run`
Expected: PASS (no behavior change; attribute is inert).

- [ ] **Step 3: Commit**

```bash
git add src/components/SourceNote.jsx
git commit -m "feat(export): mark SourceNote with data-export-source"
```

---

## Task 6: Excel builder

**Files:**
- Create: `src/lib/export/toExcel.js`
- Test: `src/lib/export/toExcel.test.js`

- [ ] **Step 1: Write the failing test**

`src/lib/export/toExcel.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../hooks/useData', () => ({
  getTabDatasetFilenames: vi.fn(),
  getCachedData: vi.fn(),
}))

import { getTabDatasetFilenames, getCachedData } from '../../hooks/useData'
import { buildWorkbook, buildExcelBlob } from './toExcel'

describe('buildWorkbook', () => {
  beforeEach(() => {
    getTabDatasetFilenames.mockReset()
    getCachedData.mockReset()
  })

  it('adds an About sheet first plus one sheet per array dataset', () => {
    getTabDatasetFilenames.mockReturnValue(['prod.json', 'matrix.json'])
    getCachedData.mockImplementation(fn =>
      fn === 'prod.json'
        ? [{ year: 2020, value: 1 }, { year: 2021, value: 2 }]
        : { countries: ['CA'], values: [[1]] }, // non-array -> matrix
    )

    const wb = buildWorkbook({ tabId: 't', tabTitle: 'Overview', rootEl: null })
    expect(wb.SheetNames[0]).toBe('About')
    expect(wb.SheetNames).toContain('prod')
    expect(wb.SheetNames).not.toContain('matrix') // matrix listed on About, not a sheet
  })
})

describe('buildExcelBlob', () => {
  it('returns a non-empty Blob', () => {
    getTabDatasetFilenames.mockReturnValue([])
    getCachedData.mockReturnValue(null)
    const blob = buildExcelBlob({ tabId: 't', tabTitle: 'Overview', rootEl: null })
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/export/toExcel.test.js`
Expected: FAIL — cannot resolve `./toExcel`.

- [ ] **Step 3: Implement the Excel builder**

`src/lib/export/toExcel.js`:
```js
import * as XLSX from 'xlsx'
import { getTabDatasetFilenames, getCachedData } from '../../hooks/useData'
import { collectSources } from './captureTab'
import {
  DASHBOARD_NAME, DASHBOARD_URL, isoDate, sanitizeSheetName,
} from './branding'

const CAVEAT =
  'Source datasets as loaded; charts on the dashboard may apply year-range filters.'

/** Build a SheetJS workbook for a tab. Exported for testing. */
export function buildWorkbook({ tabId, tabTitle, rootEl }) {
  const wb = XLSX.utils.book_new()
  const used = new Set()
  const aboutName = sanitizeSheetName('About', used) // reserve "About" first
  const sources = collectSources(rootEl)
  const matrixDatasets = []

  getTabDatasetFilenames(tabId).forEach(fn => {
    const data = getCachedData(fn)
    const isTabular =
      Array.isArray(data) && data.length > 0 && typeof data[0] === 'object'
    if (isTabular) {
      const ws = XLSX.utils.json_to_sheet(data)
      const name = sanitizeSheetName(fn.replace(/\.json$/i, ''), used)
      XLSX.utils.book_append_sheet(wb, ws, name)
    } else if (data != null) {
      matrixDatasets.push(fn)
    }
  })

  const aboutRows = [
    [DASHBOARD_NAME],
    [tabTitle || ''],
    [`Exported: ${isoDate()}`],
    [DASHBOARD_URL],
    [],
    ['Note', CAVEAT],
    [],
    ['Sources'],
    ...sources.map(s => [s]),
  ]
  if (matrixDatasets.length) {
    aboutRows.push([], ['Matrix data — see dashboard'], ...matrixDatasets.map(m => [m]))
  }
  const aboutWs = XLSX.utils.aoa_to_sheet(aboutRows)
  XLSX.utils.book_append_sheet(wb, aboutWs, aboutName)

  // Put About first.
  wb.SheetNames = [aboutName, ...wb.SheetNames.filter(n => n !== aboutName)]
  return wb
}

/** Build the workbook and serialize it to an .xlsx Blob. */
export function buildExcelBlob(opts) {
  const wb = buildWorkbook(opts)
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/export/toExcel.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/export/toExcel.js src/lib/export/toExcel.test.js
git commit -m "feat(export): build xlsx workbook from a tab's source datasets"
```

---

## Task 7: Export dispatcher + download

**Files:**
- Create: `src/lib/export/index.js`
- Test: `src/lib/export/index.test.js`

- [ ] **Step 1: Write the failing test**

`src/lib/export/index.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./toExcel', () => ({
  buildExcelBlob: vi.fn(() => new Blob(['x'], { type: 'application/octet-stream' })),
}))

import { exportTab } from './index'
import { buildExcelBlob } from './toExcel'

describe('exportTab', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake'),
      revokeObjectURL: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    buildExcelBlob.mockClear()
  })

  it('builds an xlsx blob and triggers a download with the right filename', async () => {
    await exportTab('xlsx', {
      rootEl: null, tabId: 't', tabTitle: 'Overview', tabSubtitle: '',
    })
    expect(buildExcelBlob).toHaveBeenCalledOnce()
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
  })

  it('throws on an unsupported format', async () => {
    await expect(
      exportTab('rtf', { rootEl: null, tabId: 't', tabTitle: 'X' }),
    ).rejects.toThrow(/unsupported/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/export/index.test.js`
Expected: FAIL — cannot resolve `./index`.

- [ ] **Step 3: Implement the dispatcher**

`src/lib/export/index.js`:
```js
import { exportFilename } from './branding'
import { buildExcelBlob } from './toExcel'
// PDF and PPTX builders are wired in later phases.

/** Trigger a browser download for a Blob. */
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Build and download the current tab in the requested format.
 * opts: { rootEl, tabId, tabTitle, tabSubtitle }
 */
export async function exportTab(format, opts) {
  let blob
  let ext
  if (format === 'xlsx') {
    blob = buildExcelBlob(opts)
    ext = 'xlsx'
  } else {
    throw new Error(`Unsupported export format: ${format}`)
  }
  triggerDownload(blob, exportFilename(opts.tabTitle, ext))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/export/index.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/export/index.js src/lib/export/index.test.js
git commit -m "feat(export): add exportTab dispatcher and triggerDownload"
```

---

## Task 8: useExport hook

**Files:**
- Create: `src/hooks/useExport.js`
- Test: `src/hooks/useExport.test.jsx`

- [ ] **Step 1: Write the failing test**

`src/hooks/useExport.test.jsx`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const exportTab = vi.fn(() => Promise.resolve())
vi.mock('../lib/export', () => ({ exportTab: (...a) => exportTab(...a) }))

import { useExport } from './useExport'

describe('useExport', () => {
  beforeEach(() => {
    exportTab.mockReset().mockResolvedValue()
    // Give document.getElementById('tab-content') something to find.
    document.body.innerHTML = '<div id="tab-content"></div>'
  })

  it('calls exportTab with tab options and clears the exporting flag', async () => {
    const { result } = renderHook(() =>
      useExport({ tabId: 'overview', tabTitle: 'Overview', tabSubtitle: 'sub' }),
    )
    await act(async () => { await result.current.run('xlsx') })

    expect(exportTab).toHaveBeenCalledWith('xlsx', expect.objectContaining({
      tabId: 'overview', tabTitle: 'Overview', tabSubtitle: 'sub',
    }))
    expect(result.current.exporting).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('records an error when the export fails', async () => {
    exportTab.mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useExport({ tabId: 't', tabTitle: 'T' }))
    await act(async () => { await result.current.run('xlsx') })
    await waitFor(() => expect(result.current.error).toBe('boom'))
  })

  it('errors when there is no #tab-content', async () => {
    document.body.innerHTML = ''
    const { result } = renderHook(() => useExport({ tabId: 't', tabTitle: 'T' }))
    await act(async () => { await result.current.run('xlsx') })
    expect(result.current.error).toMatch(/wait for the tab/i)
    expect(exportTab).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/useExport.test.jsx`
Expected: FAIL — cannot resolve `./useExport`.

- [ ] **Step 3: Implement the hook**

`src/hooks/useExport.js`:
```js
import { useState, useCallback } from 'react'

/**
 * Drives a tab export. `exporting` holds the in-flight format (or null);
 * `error` holds a user-facing message (or null). `run(format)` lazy-loads
 * the export module so its heavy deps stay out of the initial bundle.
 */
export function useExport({ tabId, tabTitle, tabSubtitle }) {
  const [exporting, setExporting] = useState(null)
  const [error, setError] = useState(null)

  const run = useCallback(
    async format => {
      setError(null)
      setExporting(format)
      try {
        const rootEl = document.getElementById('tab-content')
        if (!rootEl) {
          throw new Error('Wait for the tab to finish loading, then try again.')
        }
        const { exportTab } = await import('../lib/export')
        await exportTab(format, { rootEl, tabId, tabTitle, tabSubtitle })
      } catch (e) {
        console.error('[export] failed:', e)
        setError(e.message || 'Export failed')
      } finally {
        setExporting(null)
      }
    },
    [tabId, tabTitle, tabSubtitle],
  )

  return { exporting, error, run }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/useExport.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useExport.js src/hooks/useExport.test.jsx
git commit -m "feat(export): add useExport hook with lazy module load"
```

---

## Task 9: Add IconDownload

**Files:**
- Modify: `src/lib/icons.jsx`

- [ ] **Step 1: Add the icon**

In `src/lib/icons.jsx`, after `IconChevronDown`, add:
```jsx
export const IconDownload = props => (
  <Svg {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </Svg>
)
```

- [ ] **Step 2: Verify build**

Run: `npx vitest run`
Expected: PASS (no test references it yet; import resolves).

- [ ] **Step 3: Commit**

```bash
git add src/lib/icons.jsx
git commit -m "feat(export): add IconDownload"
```

---

## Task 10: ExportMenu component

**Files:**
- Create: `src/components/export/ExportMenu.jsx`
- Test: `src/components/export/ExportMenu.test.jsx`

- [ ] **Step 1: Write the failing test**

`src/components/export/ExportMenu.test.jsx`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const run = vi.fn()
let mockState = { exporting: null, error: null, run }
vi.mock('../../hooks/useExport', () => ({ useExport: () => mockState }))

import ExportMenu from './ExportMenu'

describe('ExportMenu', () => {
  beforeEach(() => {
    run.mockReset()
    mockState = { exporting: null, error: null, run }
  })

  it('opens the menu and runs the chosen format', async () => {
    render(<ExportMenu tabId="overview" tabTitle="Overview" tabSubtitle="sub" />)
    await userEvent.click(screen.getByRole('button', { name: /export/i }))
    await userEvent.click(screen.getByText(/excel/i))
    expect(run).toHaveBeenCalledWith('xlsx')
  })

  it('shows an error message when present', () => {
    mockState = { exporting: null, error: 'Export failed', run }
    render(<ExportMenu tabId="t" tabTitle="T" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Export failed')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/export/ExportMenu.test.jsx`
Expected: FAIL — cannot resolve `./ExportMenu`.

- [ ] **Step 3: Implement the component**

`src/components/export/ExportMenu.jsx`:
```jsx
import { useState, useRef, useEffect } from 'react'
import { useExport } from '../../hooks/useExport'
import { IconDownload, IconChevronDown } from '../../lib/icons'

// Formats grow per phase: Excel (phase 1), PDF (phase 2), PowerPoint (phase 3).
const FORMATS = [
  { id: 'xlsx', label: 'Excel (.xlsx)' },
]

export default function ExportMenu({ tabId, tabTitle, tabSubtitle }) {
  const [open, setOpen] = useState(false)
  const { exporting, error, run } = useExport({ tabId, tabTitle, tabSubtitle })
  const ref = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  async function handlePick(format) {
    setOpen(false)
    await run(format)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={!!exporting}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
      >
        <IconDownload className="w-4 h-4" />
        {exporting ? 'Exporting…' : 'Export'}
        <IconChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {FORMATS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => handlePick(f.id)}
              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="absolute right-0 mt-1 whitespace-nowrap text-[11px] text-rose-600"
        >
          {error}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/export/ExportMenu.test.jsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/export/ExportMenu.jsx src/components/export/ExportMenu.test.jsx
git commit -m "feat(export): add ExportMenu dropdown (Excel)"
```

---

## Task 11: Topbar actions slot

**Files:**
- Modify: `src/components/layout/Topbar.jsx`

- [ ] **Step 1: Add the actions slot**

Replace the body of `Topbar` in `src/components/layout/Topbar.jsx`:
```jsx
export default function Topbar({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      {/* Page title */}
      <div className="min-w-0">
        <h1 className="text-3xl lg:text-[34px] font-bold text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Topbar.jsx
git commit -m "feat(export): add actions slot to Topbar"
```

---

## Task 12: Wire ExportMenu + tracking into App

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add imports**

In `src/App.jsx`, add after the existing imports near the top:
```jsx
import ExportMenu from './components/export/ExportMenu'
import { setActiveTab } from './hooks/useData'
```

- [ ] **Step 2: Attribute dataset loads to the active tab**

Inside `App()`, immediately after `const tab = TABS[activeTab]` and before `const TabComponent = tab.Component`, add:
```jsx
  // Attribute useData() loads to the current tab (read during export). Calling
  // the module setter during render runs before child tabs mount, so a freshly
  // mounted tab's dataset loads are recorded under the correct id.
  setActiveTab(activeTab)
```

- [ ] **Step 3: Render ExportMenu and wrap the tab content**

In `src/App.jsx`, replace:
```jsx
            <Topbar title={tab.title} subtitle={tab.subtitle} />
            <Suspense fallback={<Loading />}>
              <TabComponent />
            </Suspense>
```
with:
```jsx
            <Topbar
              title={tab.title}
              subtitle={tab.subtitle}
              actions={
                <ExportMenu
                  tabId={activeTab}
                  tabTitle={tab.title}
                  tabSubtitle={tab.subtitle}
                />
              }
            />
            <div id="tab-content">
              <Suspense fallback={<Loading />}>
                <TabComponent />
              </Suspense>
            </div>
```

- [ ] **Step 4: Verify the suite passes**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 5: Manual verification (preview)**

Start the dev server and confirm the Excel export works end-to-end:
1. `preview_start` (Vite dev server).
2. Open the Overview tab; wait for charts to load.
3. Click **Export → Excel (.xlsx)**; confirm a file `seaweed-overview-<date>.xlsx` downloads.
4. Open it: an **About** sheet (title, date, sources, caveat) + one sheet per dataset (e.g. `global_production_by_source`, `aquaculture_share`).
5. Repeat on **Canada · Economics** to confirm the caveat/source lines populate.

Expected: files download and open correctly with populated sheets.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat(export): wire ExportMenu and active-tab tracking into App"
```

---

# PHASE 2 — PDF

## Task 13: Extend the Plotly test mock

**Files:**
- Modify: `src/test/setup.js`

- [ ] **Step 1: Add `toImage` to the mock**

In `src/test/setup.js`, change the mock's `default` object to include `toImage`:
```js
vi.mock('plotly.js-dist-min', () => ({
  default: {
    react: () => Promise.resolve(),
    purge: () => {},
    Plots: { resize: () => {} },
    toImage: () => Promise.resolve('data:image/png;base64,iVBORw0KGgo='),
  },
}))
```

- [ ] **Step 2: Verify the suite still passes**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/test/setup.js
git commit -m "test(export): add Plotly.toImage to the test mock"
```

---

## Task 14: captureTab image enumeration

**Files:**
- Modify: `src/lib/export/captureTab.js`
- Modify: `src/lib/export/captureTab.test.js`

- [ ] **Step 1: Add the failing test**

Append to `src/lib/export/captureTab.test.js`:
```js
import { vi } from 'vitest'

vi.mock('html-to-image', () => ({
  toPng: vi.fn(() => Promise.resolve('data:image/png;base64,HTML')),
}))

import { captureTab } from './captureTab'
import { toPng } from 'html-to-image'

describe('captureTab', () => {
  it('images Plotly sections via toImage and others via html-to-image, in order', async () => {
    const root = document.createElement('div')

    const plotSection = document.createElement('section')
    plotSection.innerHTML = '<h3>Heatmap</h3><div class="js-plotly-plot"></div>'

    const richSection = document.createElement('section')
    richSection.innerHTML = '<h3>KPIs</h3><div>stuff</div>'

    root.append(plotSection, richSection)

    const blocks = await captureTab(root)
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toMatchObject({ title: 'Heatmap' })
    expect(blocks[0].imageDataUrl).toMatch(/^data:image\/png/)
    expect(blocks[1]).toMatchObject({ title: 'KPIs' })
    expect(blocks[1].imageDataUrl).toBe('data:image/png;base64,HTML')
    expect(toPng).toHaveBeenCalledTimes(1) // only the rich section
  })

  it('returns [] for a null root', async () => {
    expect(await captureTab(null)).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/export/captureTab.test.js`
Expected: FAIL — `captureTab` is not exported.

- [ ] **Step 3: Implement captureTab**

Add to `src/lib/export/captureTab.js` (keep `collectSources`):
```js
import { toPng } from 'html-to-image'
import * as plotlyModule from 'plotly.js-dist-min'

const Plotly = plotlyModule.default ?? plotlyModule

function sectionTitle(section) {
  const h = section.querySelector('h1, h2, h3')
  return h && h.textContent.trim() ? h.textContent.trim() : ''
}

/**
 * Walk the direct-child sections of `rootEl` and produce ordered image blocks
 * `{ title, imageDataUrl }`. Plotly sections (heatmap/EDA) are imaged with
 * `Plotly.toImage`; everything else (Recharts SVG, KPI strips, tables,
 * insight panels) is imaged with `html-to-image`.
 */
export async function captureTab(rootEl, { scale = 2 } = {}) {
  if (!rootEl) return []
  const blocks = []
  for (const section of Array.from(rootEl.children)) {
    const plotNode = section.querySelector('.js-plotly-plot')
    let imageDataUrl
    if (plotNode) {
      imageDataUrl = await Plotly.toImage(plotNode, {
        format: 'png',
        scale,
        width: plotNode.clientWidth || 900,
        height: plotNode.clientHeight || 460,
      })
    } else {
      imageDataUrl = await toPng(section, {
        pixelRatio: scale,
        backgroundColor: '#ffffff',
      })
    }
    blocks.push({ title: sectionTitle(section), imageDataUrl })
  }
  return blocks
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/export/captureTab.test.js`
Expected: PASS (both `collectSources` and `captureTab` blocks).

- [ ] **Step 5: Commit**

```bash
git add src/lib/export/captureTab.js src/lib/export/captureTab.test.js
git commit -m "feat(export): capture tab sections to images for PDF/PPTX"
```

---

## Task 15: PDF builder

**Files:**
- Create: `src/lib/export/toPdf.js`
- Test: `src/lib/export/toPdf.test.js`

- [ ] **Step 1: Write the failing test**

`src/lib/export/toPdf.test.js`:
```js
import { describe, it, expect, vi } from 'vitest'

// 1x1 transparent PNG — valid for jsPDF.getImageProperties.
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

vi.mock('./captureTab', () => ({
  captureTab: vi.fn(() => Promise.resolve([{ title: 'Chart A', imageDataUrl: PNG }])),
  collectSources: vi.fn(() => ['Source: FAO FishStat']),
}))
// loadImageDataUrl uses fetch; let it fail so the logo is skipped (caught).
vi.mock('./branding', async orig => ({ ...(await orig()) }))

import { buildPdfBlob } from './toPdf'

describe('buildPdfBlob', () => {
  it('returns a non-empty PDF Blob', async () => {
    const blob = await buildPdfBlob({
      rootEl: document.createElement('div'),
      tabTitle: 'Overview',
      tabSubtitle: 'sub',
    })
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/export/toPdf.test.js`
Expected: FAIL — cannot resolve `./toPdf`.

- [ ] **Step 3: Implement the PDF builder**

`src/lib/export/toPdf.js`:
```js
import { jsPDF } from 'jspdf'
import { captureTab, collectSources } from './captureTab'
import {
  BRAND_TEAL, DASHBOARD_NAME, INK, MUTED,
  isoDate, psiaLogoUrl, loadImageDataUrl,
} from './branding'

const PAGE = { w: 595.28, h: 841.89 } // A4 portrait, pt
const MARGIN = 40
const HEADER_H = 64
const FOOTER_Y = PAGE.h - 24

function drawHeader(doc, title, subtitle, logo) {
  doc.setFillColor(BRAND_TEAL)
  doc.rect(0, 0, PAGE.w, HEADER_H, 'F')
  if (logo) {
    try { doc.addImage(logo, 'PNG', MARGIN, 16, 90, 32) } catch { /* ignore */ }
  }
  doc.setTextColor('#ffffff')
  doc.setFontSize(9)
  doc.text(`${DASHBOARD_NAME} · ${isoDate()}`, PAGE.w - MARGIN, 28, { align: 'right' })

  let y = HEADER_H + 28
  doc.setTextColor(INK)
  doc.setFontSize(18)
  doc.text(title || '', MARGIN, y)
  y += 16
  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(MUTED)
    const lines = doc.splitTextToSize(subtitle, PAGE.w - MARGIN * 2)
    doc.text(lines, MARGIN, y)
    y += lines.length * 12
  }
  return y + 10
}

function drawFooters(doc, sources) {
  const pages = doc.getNumberOfPages()
  const srcLine = sources.length ? `Sources: ${sources.join(' · ')}` : ''
  const clipped = srcLine.length > 150 ? `${srcLine.slice(0, 147)}…` : srcLine
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(MUTED)
    if (clipped) doc.text(clipped, MARGIN, FOOTER_Y, { maxWidth: PAGE.w - MARGIN * 2 - 40 })
    doc.text(`${p} / ${pages}`, PAGE.w - MARGIN, FOOTER_Y, { align: 'right' })
  }
}

/** Build a lightly-branded PDF of the tab as a Blob. */
export async function buildPdfBlob({ rootEl, tabTitle, tabSubtitle }) {
  const blocks = await captureTab(rootEl)
  const sources = collectSources(rootEl)
  const logo = await loadImageDataUrl(psiaLogoUrl).catch(() => null)

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  let y = drawHeader(doc, tabTitle, tabSubtitle, logo)
  const contentW = PAGE.w - MARGIN * 2

  for (const block of blocks) {
    const props = doc.getImageProperties(block.imageDataUrl)
    const imgH = (props.height / props.width) * contentW
    const titleH = block.title ? 16 : 0
    if (y + titleH + imgH > PAGE.h - 60) {
      doc.addPage()
      y = drawHeader(doc, tabTitle, tabSubtitle, logo)
    }
    if (block.title) {
      doc.setFontSize(11)
      doc.setTextColor(INK)
      doc.text(block.title, MARGIN, y)
      y += titleH
    }
    doc.addImage(block.imageDataUrl, 'PNG', MARGIN, y, contentW, imgH)
    y += imgH + 24
  }

  drawFooters(doc, sources)
  return doc.output('blob')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/export/toPdf.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/export/toPdf.js src/lib/export/toPdf.test.js
git commit -m "feat(export): build lightly-branded PDF from tab images"
```

---

## Task 16: Wire PDF into dispatcher + menu

**Files:**
- Modify: `src/lib/export/index.js`
- Modify: `src/components/export/ExportMenu.jsx`

- [ ] **Step 1: Add the PDF branch to the dispatcher**

In `src/lib/export/index.js`, add the import:
```js
import { buildPdfBlob } from './toPdf'
```
and add a branch inside `exportTab` before the `else`:
```js
  } else if (format === 'pdf') {
    blob = await buildPdfBlob(opts)
    ext = 'pdf'
```
so the chain reads `if (xlsx) … else if (pdf) … else throw`.

- [ ] **Step 2: Add PDF to the menu**

In `src/components/export/ExportMenu.jsx`, extend `FORMATS`:
```jsx
const FORMATS = [
  { id: 'pdf', label: 'PDF (.pdf)' },
  { id: 'xlsx', label: 'Excel (.xlsx)' },
]
```

- [ ] **Step 3: Run the suite**

Run: `npx vitest run`
Expected: PASS (existing ExportMenu test clicks "Excel" by text, still matches).

- [ ] **Step 4: Manual verification (preview)**

1. `preview_start`; open **Economics** (Recharts charts) and wait for load.
2. **Export → PDF**; confirm `seaweed-economics-<date>.pdf` downloads with a teal header, charts, and a source footer.
3. Open the **EDA** tab (Plotly) and export PDF; confirm the Plotly charts render in the PDF (this is the capture risk from the spec — verify fidelity; if a Plotly section is blank, note it and capture per-`.js-plotly-plot` node).

Expected: readable, branded PDFs on both Recharts and Plotly tabs.

- [ ] **Step 5: Commit**

```bash
git add src/lib/export/index.js src/components/export/ExportMenu.jsx
git commit -m "feat(export): enable PDF export in dispatcher and menu"
```

---

# PHASE 3 — PowerPoint

## Task 17: PPTX builder

**Files:**
- Create: `src/lib/export/toPptx.js`
- Test: `src/lib/export/toPptx.test.js`

- [ ] **Step 1: Write the failing test**

`src/lib/export/toPptx.test.js`:
```js
import { describe, it, expect, vi } from 'vitest'

const slide = { background: undefined, addText: vi.fn(), addImage: vi.fn() }
const pptxInstance = {
  defineLayout: vi.fn(),
  layout: '',
  addSlide: vi.fn(() => slide),
  write: vi.fn(() => Promise.resolve(new Blob(['pptx']))),
}
vi.mock('pptxgenjs', () => ({ default: vi.fn(() => pptxInstance) }))
vi.mock('./captureTab', () => ({
  captureTab: vi.fn(() => Promise.resolve([
    { title: 'Chart A', imageDataUrl: 'data:image/png;base64,AAAA' },
  ])),
  collectSources: vi.fn(() => ['Source: FAO']),
}))

import { buildPptxBlob } from './toPptx'

describe('buildPptxBlob', () => {
  it('builds a title slide + one slide per block and returns a Blob', async () => {
    const blob = await buildPptxBlob({
      rootEl: document.createElement('div'),
      tabTitle: 'Overview',
      tabSubtitle: 'sub',
    })
    expect(pptxInstance.addSlide).toHaveBeenCalledTimes(2) // title + 1 content
    expect(slide.addImage).toHaveBeenCalled()
    expect(blob).toBeInstanceOf(Blob)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/export/toPptx.test.js`
Expected: FAIL — cannot resolve `./toPptx`.

- [ ] **Step 3: Implement the PPTX builder**

`src/lib/export/toPptx.js`:
```js
import PptxGenJS from 'pptxgenjs'
import { captureTab, collectSources } from './captureTab'
import {
  BRAND_TEAL, DASHBOARD_NAME, isoDate, psiaLogoUrl, loadImageDataUrl,
} from './branding'

// pptxgenjs colors are hex strings without '#'.
const hex = c => c.replace('#', '')

/** Build a lightly-branded 16:9 deck of the tab as a Blob. */
export async function buildPptxBlob({ rootEl, tabTitle, tabSubtitle }) {
  const blocks = await captureTab(rootEl)
  const sources = collectSources(rootEl)
  const logo = await loadImageDataUrl(psiaLogoUrl).catch(() => null)

  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 })
  pptx.layout = 'WIDE'

  // Title slide
  const title = pptx.addSlide()
  title.background = { color: hex(BRAND_TEAL) }
  if (logo) title.addImage({ data: logo, x: 0.5, y: 0.5, w: 2.2, h: 0.8 })
  title.addText(tabTitle || DASHBOARD_NAME, {
    x: 0.6, y: 2.6, w: 12, h: 1, fontSize: 36, bold: true, color: 'FFFFFF',
  })
  if (tabSubtitle) {
    title.addText(tabSubtitle, { x: 0.6, y: 3.7, w: 12, h: 1, fontSize: 16, color: 'E2F4F1' })
  }
  title.addText(`${DASHBOARD_NAME} · ${isoDate()}`, {
    x: 0.6, y: 6.8, w: 12, fontSize: 10, color: 'E2F4F1',
  })

  // Content slides
  const footnote = sources.length ? `Sources: ${sources.join(' · ')}` : ''
  blocks.forEach(block => {
    const s = pptx.addSlide()
    if (block.title) {
      s.addText(block.title, {
        x: 0.5, y: 0.3, w: 12.3, h: 0.6, fontSize: 20, bold: true, color: '0F172A',
      })
    }
    s.addImage({
      data: block.imageDataUrl,
      x: 0.7, y: 1.1, w: 11.9, h: 5.6,
      sizing: { type: 'contain', w: 11.9, h: 5.6 },
    })
    if (footnote) {
      s.addText(footnote, { x: 0.5, y: 7.0, w: 12.3, fontSize: 8, color: '64748B' })
    }
  })

  return pptx.write('blob')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/export/toPptx.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/export/toPptx.js src/lib/export/toPptx.test.js
git commit -m "feat(export): build lightly-branded pptx deck from tab images"
```

---

## Task 18: Wire PPTX into dispatcher + menu

**Files:**
- Modify: `src/lib/export/index.js`
- Modify: `src/components/export/ExportMenu.jsx`

- [ ] **Step 1: Add the PPTX branch to the dispatcher**

In `src/lib/export/index.js`, add the import:
```js
import { buildPptxBlob } from './toPptx'
```
and add a branch inside `exportTab`:
```js
  } else if (format === 'pptx') {
    blob = await buildPptxBlob(opts)
    ext = 'pptx'
```

- [ ] **Step 2: Add PowerPoint to the menu**

In `src/components/export/ExportMenu.jsx`, set `FORMATS` to the full list:
```jsx
const FORMATS = [
  { id: 'pdf', label: 'PDF (.pdf)' },
  { id: 'pptx', label: 'PowerPoint (.pptx)' },
  { id: 'xlsx', label: 'Excel (.xlsx)' },
]
```

- [ ] **Step 3: Run the suite**

Run: `npx vitest run`
Expected: PASS.

- [ ] **Step 4: Manual verification (preview)**

1. `preview_start`; open **Overview**.
2. **Export → PowerPoint**; confirm `seaweed-overview-<date>.pptx` downloads.
3. Open it: a teal title slide (logo + tab title) followed by one slide per section with the source footnote.

Expected: a valid, branded deck that opens in PowerPoint / Google Slides.

- [ ] **Step 5: Final full-suite run + commit**

Run: `npx vitest run`
Expected: PASS (whole suite).

```bash
git add src/lib/export/index.js src/components/export/ExportMenu.jsx
git commit -m "feat(export): enable PowerPoint export in dispatcher and menu"
```

---

## Self-Review (completed during planning)

- **Spec coverage:** PDF (Task 15–16), PowerPoint (Task 17–18), Excel (Task 6, 12) — all present. Branding/header/footer (Task 2, 15, 17). `data-export-source` + `collectSources` (Task 4–5). `#tab-content` + active-tab tracking + `setActiveTab` (Task 3, 12). Topbar `actions` + `ExportMenu` (Task 10–12). Lazy-load (`useExport` dynamic import, Task 8). Error handling + loading guard (Task 8). Excel "About" sheet + matrix handling + caveat (Task 6). Testing matches §8 (branding, useData accessors, captureTab, useExport, smoke builders).
- **Placeholder scan:** No TBD/TODO; every code step shows complete code.
- **Type/name consistency:** `exportTab(format, { rootEl, tabId, tabTitle, tabSubtitle })`, `buildExcelBlob`/`buildWorkbook`, `buildPdfBlob`, `buildPptxBlob`, `captureTab`/`collectSources`, `getTabDatasetFilenames`/`getCachedData`/`setActiveTab`, `exportFilename`/`sanitizeSheetName`/`loadImageDataUrl` are used consistently across tasks.
- **Known risk (carried from spec):** Plotly section fidelity under capture is verified manually in Task 16, Step 4.
