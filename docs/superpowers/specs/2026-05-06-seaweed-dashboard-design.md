# Seaweed Industry Dashboard — Design Spec
**Date:** 2026-05-06  
**Author:** Dhruvkumar Patel  
**Goal:** React web app presenting all EDA charts from the FAO seaweed notebook interactively for a capstone sponsor demo.

---

## 1. Architecture

### Stack
- **Build tool:** Vite + React 18
- **Charting:** react-plotly.js (Plotly.js wrapper)
- **Styling:** Tailwind CSS
- **Data:** Static JSON files pre-processed from CSVs (no backend)

### Data Flow
1. `scripts/preprocess.py` reads the 4 source CSVs from `dataset/` and writes 18 JSON files into `public/data/`
2. React app fetches only the JSON files needed for the active tab (lazy loading via `useData` hook)
3. All filtering (year range, country, top-N) happens client-side in React

### Source CSVs
| File | Rows |
|------|------|
| `dataset/seaweed_global_production.csv` | 11,899 |
| `dataset/seaweed_aquaculture_quantity.csv` | 4,597 |
| `dataset/seaweed_aquaculture_value.csv` | 3,405 |
| `dataset/seaweed_capture_quantity.csv` | 7,302 |

---

## 2. Project Structure

```
seaweed-industry/
├── dataset/                        ← source CSVs (unchanged)
├── scripts/
│   └── preprocess.py               ← run once to generate JSON
├── public/
│   └── data/                       ← 18 generated JSON files
├── src/
│   ├── main.jsx
│   ├── App.jsx                     ← tab router + global year filter state
│   ├── index.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx          ← title + global year range slider
│   │   │   └── TabNav.jsx          ← 6-tab navigation bar
│   │   ├── charts/
│   │   │   ├── AreaChart.jsx       ← reusable stacked area (Plotly)
│   │   │   ├── BarChart.jsx        ← reusable horizontal bar (Plotly)
│   │   │   ├── LineChart.jsx       ← reusable single/multi line (Plotly)
│   │   │   ├── ScatterChart.jsx    ← log-log scatter (Plotly)
│   │   │   └── Heatmap.jsx         ← country×species heatmap (Plotly)
│   │   ├── controls/
│   │   │   ├── YearRangeSlider.jsx ← dual-handle year range slider
│   │   │   ├── MultiSelect.jsx     ← country/species multiselect dropdown
│   │   │   └── Dropdown.jsx        ← single-select dropdown (top-N, window)
│   │   └── DataTable.jsx           ← sortable table with pagination
│   ├── tabs/
│   │   ├── OverviewTab.jsx
│   │   ├── CountriesTab.jsx
│   │   ├── RegionsTab.jsx
│   │   ├── SpeciesTab.jsx
│   │   ├── EconomicsTab.jsx
│   │   └── DataQualityTab.jsx
│   ├── hooks/
│   │   └── useData.js              ← fetch JSON, cache in memory, return {data, loading, error}
│   └── utils/
│       └── formatters.js           ← formatMillionTonnes, formatUSD, formatPct helpers
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 3. Tab Structure & Charts

### Tab 1 — Overview
| Chart | Type | Controls |
|-------|------|----------|
| Global production by source (Capture / Marine / Brackish / Freshwater aquaculture) | Stacked area | Global year range slider |
| Aquaculture share % of total tonnage | Line | Global year range slider |
| Capture vs. aquaculture — linear + log panels | Dual-panel line | Global year range slider |

**JSON:** `global_production_by_source.json`, `aquaculture_share.json`, `capture_vs_aquaculture.json`

---

### Tab 2 — Countries
| Chart | Type | Controls |
|-------|------|----------|
| Top N producing countries (avg tonnes/yr) | Horizontal bar | Top-N dropdown (10/15/20), year window dropdown |
| Production trajectory of selected countries | Multi-line | Country multiselect (default: top 5), global year range |

**JSON:** `country_totals.json`, `country_timeseries.json`

---

### Tab 3 — Regions
| Chart | Type | Controls |
|-------|------|----------|
| Production by continent | Stacked area | Global year range slider |
| Production by income group | Stacked area | Global year range slider |

**JSON:** `by_continent.json`, `by_income_group.json`

---

### Tab 4 — Species & Aquaculture
| Chart | Type | Controls |
|-------|------|----------|
| Top 15 species by output | Horizontal bar | Year window dropdown |
| Country × species specialization | Heatmap | Top-N dropdown (5/10/15) |
| Aquaculture quantity by environment | Stacked area | Global year range slider |
| Aquaculture environment % share | Stacked area | Global year range slider |

**JSON:** `species_totals.json`, `country_species_matrix.json`, `env_quantity.json`, `env_share.json`

---

### Tab 5 — Economics
| Chart | Type | Controls |
|-------|------|----------|
| Global volume-weighted average price (USD/tonne) | Line | Global year range slider |
| Price by farming environment (log scale) | Multi-line (log y) | Global year range slider |
| Country volume vs. value (log-log scatter) | Scatter | Year window dropdown, labeled top producers |
| Highest-value species | Sortable table | Year filter dropdown, sort by any column |

**JSON:** `price_global.json`, `price_by_env.json`, `country_value_volume.json`, `species_price_table.json`

---

### Tab 6 — Data Quality
| Chart | Type | Controls |
|-------|------|----------|
| Status flag distribution (4 datasets) | Small multiples — 4 bar charts | None |
| VALUE distribution on log10 scale (4 datasets) | Small multiples — 4 histograms | None |
| Records reported per year by dataset | Multi-line | None |
| Null counts / zero counts / duplicates | Summary table | None |

**JSON:** `status_distribution.json`, `value_distribution.json`, `records_per_year.json` (also contains quality summary)

---

## 4. JSON Files Generated by preprocess.py

| File | Shape / Contents |
|------|-----------------|
| `global_production_by_source.json` | `[{year, source, value_mt}]` |
| `aquaculture_share.json` | `[{year, share_pct}]` |
| `capture_vs_aquaculture.json` | `[{year, capture_mt, aquaculture_mt}]` |
| `country_totals.json` | `[{country, year_start, year_end, avg_tonnes_mt}]` — all 5-yr windows |
| `country_timeseries.json` | `[{year, country, value_mt}]` — all countries |
| `by_continent.json` | `[{year, continent, value_mt}]` |
| `by_income_group.json` | `[{year, income_group, value_mt}]` |
| `species_totals.json` | `[{species, year_start, year_end, avg_tonnes_mt}]` |
| `country_species_matrix.json` | `{countries: [...], species: [...], values: [[...]]}` |
| `env_quantity.json` | `[{year, environment, value_mt}]` |
| `env_share.json` | `[{year, environment, share_pct}]` |
| `price_global.json` | `[{year, usd_per_tonne}]` |
| `price_by_env.json` | `[{year, environment, usd_per_tonne}]` |
| `country_value_volume.json` | `[{country, year_start, year_end, avg_tonnes, avg_value_musd, usd_per_tonne}]` |
| `species_price_table.json` | `[{species, tonnes, value_kusd, usd_per_tonne}]` per year |
| `status_distribution.json` | `{dataset: [{status_label, pct}]}` |
| `value_distribution.json` | `{dataset: [{bin_start, bin_end, count}]}` (log10 bins) |
| `records_per_year.json` | `[{year, dataset, count}]` + quality summary object |

---

## 5. Global Filter

A **year range slider** (1950–2024) lives in the `Header` component and is stored in React context. All tabs read `[yearMin, yearMax]` from context and filter their data accordingly. Tab-local controls (top-N, country multiselect) are managed in each tab's local state.

---

## 6. Styling

- Tailwind CSS utility classes throughout
- Dark header bar with app title and year range slider
- Tab navigation: pill-style active tab indicator
- Chart cards: white background, subtle shadow, rounded corners
- Responsive: charts reflow to single column on narrow viewports
- Plotly theme: `plotly_white` template with a consistent seagreen/blue/orange color palette

---

## 7. preprocess.py Behaviour

- Reads all 4 CSVs from `../dataset/` (relative to script location)
- Applies the same decode maps as the notebook (STATUS_MAP, ENV_MAP, SOURCE_MAP)
- Writes all 18 JSON files to `../public/data/`
- Prints a summary line per file: filename, row count, file size
- Requires only `pandas` and `numpy` (no additional dependencies)

---

## 8. Out of Scope

- Backend / API server
- Authentication
- Real-time data updates
- Mobile-native layout (responsive web only)
- Export to PDF / Excel (Plotly's built-in PNG download is sufficient)
