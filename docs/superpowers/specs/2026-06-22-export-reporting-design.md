# Export / Reporting — Design Spec

**Date:** 2026-06-22
**Author:** Dhruvkumar Patel
**Branch:** `feature/export-reporting`
**Goal:** Let any user of the live dashboard download the **current tab** as a lightly-branded **PDF**, **PowerPoint (.pptx)**, or **Excel (.xlsx)** file — entirely client-side, with no backend dependency.

---

## 1. Context & Constraints

- **Audience:** PSIA stakeholders and the capstone sponsor — people who need to carry findings into reports, decks, and meetings.
- **Where it runs:** Fully in the browser on the deployed (Vercel) site. No backend, no server round-trip. Works for any visitor.
- **Branding level:** *Lightly branded* — PSIA logo, brand colors, the tab's title + subtitle, source/methodology footnotes, and the export date. Clean and credible, not pixel-perfect to the offline deck pipeline.
- **Data-honesty constraint:** Outside trade + NS leases, Canadian figures are all-aquaculture proxies. Every exported artifact must carry the relevant source citations and caveats (see [Seaweed data-honesty caveat] in project memory).
- **Assembly approach:** **A — Minimal-touch capture.** Export works off what is already rendered, with near-zero changes to existing chart components. (Approaches B "structured registry" and C "per-chart only" were considered and rejected for v1: B is more invasive/slower to ship; C does not deliver the whole-tab report the sponsor needs.)

### Existing structure this builds on
- **Charts are mostly Recharts** (`src/components/charts/*` → `src/components/ui/chart.jsx`), rendered as inline **SVG**. Recharts holds its data in React props, **not** in the DOM — there are no readable "traces" on the rendered nodes.
- **Plotly is used only by `Heatmap.jsx` and `EdaTab.jsx`** (via `src/lib/Plot.jsx`, wrapping `plotly.js-dist-min`). Those render a node with the `.js-plotly-plot` class.
- Tabs mix charts, **KPI cards** (`KpiCard`), **tables** (`DataTable`/`ResultTable`), and **insight panels** (`ChartWithInsights`/`InsightsList`) — all rendered HTML/SVG.
- Source data lives in `public/data/*.json`, fetched and cached by the `useData` hook (`src/hooks/useData.js`); each tab loads a known set of these files.
- `Topbar.jsx` renders the active tab's title + subtitle. `SourceNote.jsx` renders per-chart source/caveat citations.

### Consequences for capture
- **Images:** Recharts SVG captures cleanly with `html-to-image`. Plotly nodes (heatmap/EDA) are captured with `Plotly.toImage` for fidelity. This is *easier* than the original Plotly-everywhere assumption.
- **Data (Excel):** Because Recharts data is not in the DOM, Excel exports the **source datasets the active tab loaded** (read from the `useData` cache), not the exact in-DOM series. See §5.

---

## 2. Libraries

All client-side and **lazy-loaded** (dynamic `import()`) only when the user first clicks Export, so they do not bloat initial page load.

| Library | Purpose |
|---|---|
| `jspdf` | PDF generation |
| `pptxgenjs` | PowerPoint generation |
| `xlsx` (SheetJS) | Excel generation |
| `html-to-image` | Capture Recharts SVG + HTML sections (KPI cards, tables, insight panels) to PNG — the primary capture path |
| `plotly.js-dist-min` (already bundled) | `Plotly.toImage(node, { format: 'png', scale: 2 })` for the Plotly-only nodes (heatmap, EDA tab) |

---

## 3. New Module: `src/lib/export/`

| File | Responsibility |
|---|---|
| `captureTab.js` | Walk the **direct-child sections** of the content root in DOM order; emit ordered image blocks `{ title, imageDataUrl }`, plus a `collectSources(rootEl)` helper. Per section: if it contains a `.js-plotly-plot` node, image it with `Plotly.toImage` (heatmap/EDA); otherwise image the whole section with `html-to-image` (Recharts SVG, KPI strips, tables, insight panels all capture fine). Title comes from the section's heading. |
| `toPdf.js` | Build the branded PDF from image blocks (see §5). |
| `toPptx.js` | Build the branded deck from image blocks (see §5). |
| `toExcel.js` | Build the workbook from the active tab's **source datasets** (read via the `useData` accessors), not the DOM (see §5). |
| `branding.js` | PSIA logo asset, brand hex (sourced from `chartTheme`), header/footer drawing helpers, `exportFilename(tab, ext, date)`, `sanitizeSheetName(name, used)`, `loadImageDataUrl(url)`. |
| `index.js` | Public entry: `exportTab(format, { rootEl, tabId, tabTitle, tabSubtitle })`. |

`extractPlotData` (Plotly-trace → rows) is **not** part of this design — chart data is sourced from the `useData` cache, not from rendered nodes.

---

## 4. UI + Wiring

- **`src/components/export/ExportMenu.jsx`** — a button + dropdown (PDF / PowerPoint / Excel) rendered in the **Topbar**, to the right of the title. Shows a spinner while exporting; disabled during an in-flight export.
- **`src/hooks/useExport.js`** — `{ exporting, error, run(format) }`. Lazy-imports `src/lib/export`, locates the content root, triggers the browser file download, and handles errors.
- **`src/hooks/useData.js`** — add three small accessors so Excel can find the active tab's datasets without a static, drift-prone map:
  - `setActiveTab(id)` — records which tab is mounting.
  - on each load (cache hit or fetch), associate `filename` with the current active tab.
  - `getTabDatasetFilenames(id)` → `string[]` and `getCachedData(filename)` → the cached JSON.
- **`src/App.jsx`** — two small changes: wrap the rendered `<TabComponent />` in `<div id="tab-content">` (stable export root), and call `setActiveTab(activeTab)` so dataset loads are attributed to the right tab. Pass `activeTab`/title/subtitle to the Topbar's `ExportMenu`. **No per-tab changes.**
- **`src/components/layout/Topbar.jsx`** — accept an optional `actions` slot and render `ExportMenu` there.
- **`src/components/SourceNote.jsx`** — add a `data-export-source` marker attribute (one line) so source/caveat lines can be reliably collected into export footers and the Excel "About" sheet.

---

## 5. Output Formats (lightly branded)

### PDF (`jspdf`)
- Brand-teal header band: white PSIA logo + dashboard name + export date.
- Tab title + subtitle.
- **Section-by-section compose:** each image block from `captureTab` (Recharts SVG via `html-to-image`; Plotly nodes via `Plotly.toImage`) placed in DOM order, scaled to page width, paginated.
- Footer: source citations + caveat + page number.
- *Decision:* compose from per-section images rather than one giant screenshot — gives pagination control and reuses the same block enumeration as PPTX.

### PowerPoint (`pptxgenjs`), 16:9
- Title slide: logo, dashboard name, tab title + subtitle, date.
- One slide per image block in DOM order (chart, KPI strip, insight panel, or table), each with its title and a source footnote where available.
- Branded slide master with footer + page number.

### Excel (`xlsx`)
- "About" sheet: tab title, export date, full source list + caveat, dashboard URL, and the note **"Source datasets as loaded; charts on the dashboard may apply year-range filters."**
- One data sheet per **source dataset** the active tab loaded — filenames from `getTabDatasetFilenames(tabId)`, data from `getCachedData(filename)`. Array-of-objects datasets convert directly via SheetJS `json_to_sheet`; sheet name = sanitized dataset name (≤ 31 chars, deduped).
- Non-tabular datasets (e.g., the `country_species_matrix.json` `{countries, species, values}` shape) are listed on the "About" sheet as "matrix data — see dashboard" rather than forced into a sheet.

---

## 6. Branding

- Use the white PSIA logo (`psia-logo-white-green.png`) on a **brand-teal band** so it reads on light pages. Confirm during build whether a dark-on-light logo asset exists; if so prefer it for white areas, otherwise keep the band approach.
- Brand hex sourced from `src/lib/chartTheme.js` for visual consistency with the dashboard.
- Source notes + caveats collected from `data-export-source` elements within the captured root feed the PDF footer, the PPTX chart footnotes, and the Excel "About" sheet.

---

## 7. Error Handling

- Each format builder wrapped in try/catch → non-blocking inline message in `ExportMenu` ("Export failed — try again"); detail to `console.error`.
- Guard: if `#tab-content` is missing or still shows loading skeletons (no chart/section content yet), disable Export or show "Wait for the tab to finish loading."
- Image capture (`html-to-image` / `Plotly.toImage`) is async per section; run sequentially or with a small concurrency cap.
- Filenames sanitized; large PDFs/decks are acceptable.

---

## 8. Testing (Vitest, matching existing setup)

**Unit**
- `branding`: `exportFilename` (slug + date + ext) and `sanitizeSheetName` (≤ 31 chars, illegal-char strip, dedupe).
- `useData` accessors: `setActiveTab` + load attribution → `getTabDatasetFilenames`; `getCachedData` round-trip.
- `captureTab`: section enumeration over a jsdom fixture (a Plotly-class section + a plain SVG/HTML section), with `Plotly.toImage` and `html-to-image` mocked → assert correct ordered image blocks; `collectSources` reads `data-export-source` text.
- `useExport`: state transitions (`exporting` true/false), download trigger, and error path (mocked export module).

**Smoke**
- Each builder (`toPdf`/`toPptx`/`toExcel`) returns a non-empty Blob given fixture inputs (no binary-content assertions; heavy libs partially mocked as needed).

**Manual (preview)**
- Load the app; click Export → each format on Overview, Economics, and a KPI tab; confirm files download and open correctly.

---

## 9. Phasing (each step a shippable commit on `feature/export-reporting`)

1. **Foundation + Excel** — `branding` helpers, `useData` accessors, `ExportMenu`, `useExport`, App/Topbar/SourceNote touches, `toExcel`. Excel needs no image capture, so it proves the menu → download pipeline end-to-end first.
2. **PDF** — `captureTab` + `toPdf` with branded chrome + pagination. **Verify early in this phase:** Recharts SVG is the happy path for `html-to-image`; confirm the **Plotly** sections (heatmap, EDA tab) capture acceptably via `Plotly.toImage`. EDA fidelity is the main capture risk — settle it before PPTX.
3. **PowerPoint** — `toPptx` with slide master (reuses `captureTab` from phase 2).

Tests accompany each step.

---

## 10. Out of Scope (v1)

- Multi-tab / "export the entire dashboard" report (one tab at a time only).
- Pre-export customization (choosing which blocks to include).
- Server-side high-fidelity decks (the offline Playwright + python-pptx pipeline stays separate).
- Per-chart download menus (a possible later enhancement; Approach C).
- Scheduled or emailed reports.

---

## 11. Follow-on (separate effort)

"Smarter AI chat" — explain-this-chart deep links, suggested follow-ups, exporting a chat answer as a chart/CSV — is the agreed next feature after export/reporting ships. Not part of this spec.
