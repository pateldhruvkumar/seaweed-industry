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
- All charts render through `src/lib/Plot.jsx` (a thin wrapper over `plotly.js-dist-min`) into a DOM node carrying Plotly's `.js-plotly-plot` class. Each node exposes `.data` (traces) and `.layout`.
- Tabs mix Plotly **charts**, **KPI cards** (`KpiCard`), **tables** (`DataTable`/`ResultTable`), and **insight panels** (`ChartWithInsights`/`InsightsList`) — all rendered HTML.
- `Topbar.jsx` renders the active tab's title + subtitle. `SourceNote.jsx` renders per-chart source/caveat citations.

---

## 2. Libraries

All client-side and **lazy-loaded** (dynamic `import()`) only when the user first clicks Export, so they do not bloat initial page load.

| Library | Purpose |
|---|---|
| `jspdf` | PDF generation |
| `pptxgenjs` | PowerPoint generation |
| `xlsx` (SheetJS) | Excel generation |
| `html-to-image` | Capture HTML blocks (KPI cards, tables, insight panels) to PNG |
| `plotly.js-dist-min` (already bundled) | `Plotly.toImage(node, { format: 'png', scale: 2 })` for crisp chart images |

---

## 3. New Module: `src/lib/export/`

| File | Responsibility |
|---|---|
| `captureTab.js` | Walk the active tab's content root in DOM order; emit ordered blocks `{ kind: 'chart' \| 'kpis' \| 'table' \| 'insights', title, imageDataUrl, data? }`. Charts located via `.js-plotly-plot`; title from the nearest `ChartCard` heading (fallback `node.layout.title`); non-chart blocks captured with `html-to-image`. Also collects source-note text (see §6). |
| `extractPlotData.js` | Convert a chart node's `.data` traces into tabular rows. Multi-line / shared-x traces → one table keyed on x; heatmap → x×y matrix; unrecognized shape → return empty + an `imageOnly: true` flag. |
| `toPdf.js` | Build the branded PDF (see §5). |
| `toPptx.js` | Build the branded deck (see §5). |
| `toExcel.js` | Build the workbook (see §5). |
| `branding.js` | PSIA logo asset, brand hex (sourced from `chartTheme`), header/footer drawing helpers, `exportFilename(tab, date, ext)`. |
| `index.js` | Public entry: `exportTab(format, { rootEl, tabTitle, tabSubtitle, sources })`. |

---

## 4. UI + Wiring

- **`src/components/export/ExportMenu.jsx`** — a button + dropdown (PDF / PowerPoint / Excel) rendered in the **Topbar**, to the right of the title. Shows a spinner while exporting; disabled during an in-flight export.
- **`src/hooks/useExport.js`** — `{ exporting, error, run(format) }`. Lazy-imports `src/lib/export`, locates the content root, triggers the browser file download, and handles errors.
- **`src/App.jsx`** — one small change: wrap the rendered `<TabComponent />` in `<div id="tab-content">` so the exporter has a stable root element. **No per-tab changes.**
- **`src/components/SourceNote.jsx`** — add a `data-export-source` marker attribute (one line) so source/caveat lines can be reliably collected into export footers and the Excel "About" sheet.

---

## 5. Output Formats (lightly branded)

### PDF (`jspdf`)
- Brand-teal header band: white PSIA logo + dashboard name + export date.
- Tab title + subtitle.
- **Block-by-block compose** (charts via `Plotly.toImage`, KPI/table/insight blocks via `html-to-image`) flowed and paginated.
- Footer: source citations + caveat + page number.
- *Decision:* block-compose rather than one full-page screenshot — avoids Plotly rendering glitches inside `html-to-image` and reuses the same block enumeration as the other two formats.

### PowerPoint (`pptxgenjs`), 16:9
- Title slide: logo, dashboard name, tab title + subtitle, date.
- One slide per chart: chart image + source footnote.
- A "Highlights" slide: KPI-strip image + insight bullets (when present).
- Branded slide master with footer + page number.

### Excel (`xlsx`)
- "About" sheet: tab title, export date, full source list + caveat, dashboard URL.
- One data sheet per chart, from `extractPlotData` (sheet name = sanitized chart title, truncated to Excel's 31-char limit).
- Charts whose data cannot be parsed are listed on the "About" sheet as "image-only."

---

## 6. Branding

- Use the white PSIA logo (`psia-logo-white-green.png`) on a **brand-teal band** so it reads on light pages. Confirm during build whether a dark-on-light logo asset exists; if so prefer it for white areas, otherwise keep the band approach.
- Brand hex sourced from `src/lib/chartTheme.js` for visual consistency with the dashboard.
- Source notes + caveats collected from `data-export-source` elements within the captured root feed the PDF footer, the PPTX chart footnotes, and the Excel "About" sheet.

---

## 7. Error Handling

- Each format builder wrapped in try/catch → non-blocking inline message in `ExportMenu` ("Export failed — try again"); detail to `console.error`.
- Guard: if `#tab-content` is missing or no chart nodes have rendered yet (tab still loading), disable Export or show "Wait for the tab to finish loading."
- `Plotly.toImage` is async per chart; run with a sane concurrency cap.
- Filenames sanitized; large PDFs/decks are acceptable.

---

## 8. Testing (Vitest, matching existing setup)

**Unit**
- `extractPlotData`: line, multi-line shared-x, heatmap, and unknown-shape cases.
- `exportFilename`: naming/format.
- `captureTab`: block enumeration over a jsdom fixture (`.js-plotly-plot` + KPI/table blocks), with `Plotly.toImage` mocked → assert correct ordered block list.
- `useExport`: state transitions (`exporting` true/false), download trigger, and error path (mocked export module).

**Smoke**
- Each builder (`toPdf`/`toPptx`/`toExcel`) returns a non-empty Blob given fixture blocks (no binary-content assertions; heavy libs partially mocked as needed).

**Manual (preview)**
- Load the app; click Export → each format on Overview, Economics, and a KPI tab; confirm files download and open correctly.

---

## 9. Phasing (each step a shippable commit on `feature/export-reporting`)

1. **Foundation + Excel** — `captureTab`, `extractPlotData`, `ExportMenu`, `useExport`, App/SourceNote touches, `toExcel`. Simplest format proves the pipeline end-to-end.
2. **PDF** — `toPdf` with branded chrome + pagination.
3. **PowerPoint** — `toPptx` with slide master.

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
