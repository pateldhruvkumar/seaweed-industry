# EDA Tab — Design

**Date:** 2026-05-07
**Status:** Approved (pending implementation plan)

## Goal

Add a new **EDA** (Exploratory Data Analysis) tab to the seaweed dashboard. The tab presents basic descriptive statistics, distributions, and structural views across the four FAO datasets (`global_production`, `aquaculture_quantity`, `aquaculture_value`, `capture_quantity`) so a user can size up the data without leaving the app.

The existing **Data Quality** tab already covers status-flag distributions, value histograms (log scale), and records-per-year. EDA fills the gaps: summary stats, missing-data shape, unique-entity counts over time, top-N breakdowns, value-vs-quantity correlation, and outliers.

## Non-goals

- No interactive filtering on the EDA tab (no year sliders, no country/species pickers).
- No new chart primitives. Reuse existing `BarChart`, `LineChart`, `ScatterChart`, `Heatmap`, `DataTable`.
- No theme work. The EDA tab inherits the current light styling.
- No backend service. All data is precomputed JSON served from `public/data/`.

## Sidebar change

In `src/components/layout/Sidebar.jsx`:

1. Move the **Operations** group to the **top** of `NAV_GROUPS` (above `Dashboard`).
2. Add a new entry inside Operations:
   - `id: 'eda'`
   - `label: 'EDA'`
   - `Icon: IconSparkles` (already exported from `src/lib/icons.jsx`)

Final group order:

```
Operations            ← moved to top
  • Data Quality
  • EDA               ← new
Dashboard
  • Overview
Geography
  • Countries
  • Regions
Production
  • Species & Aquaculture
  • Economics
Market & End-Use KPIs
  • (5 KPI tabs, unchanged)
```

In `src/App.jsx`, register the new tab under id `eda`:

- `Component`: `EdaTab` (lazy-loaded, matching the pattern of the other tabs)
- `title`: `'Exploratory Data Analysis'`
- `subtitle`: `'Summary statistics, distributions, and structural views across the four FAO datasets.'`

## Tab content (top to bottom)

The tab is a single scrollable page. Each section is a `ChartCard`. Where four datasets are shown, the layout is a 2-column grid (`grid grid-cols-1 md:grid-cols-2 gap-4`), matching the recently updated Data Quality tab.

The four datasets are referenced consistently as:
`global_production`, `aquaculture_quantity`, `aquaculture_value`, `capture_quantity`.

### Section 1 — Dataset summary

Component: `DataTable` (existing).

One row per dataset, columns:

| Column | Source |
|---|---|
| Dataset | constant |
| Rows | `len(df)` |
| Year range | `min(PERIOD)` – `max(PERIOD)` |
| Countries | `df['COUNTRY.UN_CODE'].nunique()` |
| Species | `df['SPECIES.ALPHA_3_CODE'].nunique()` (or `null` if the dataset has no species column) |
| mean / median / std | of `VALUE` column |
| min / p25 / p75 / max | of `VALUE` column |

Data file: `eda_summary_stats.json` (new).

### Section 2 — Missing-data matrix

Per-dataset horizontal bar chart of % null per column. 2-up grid (4 small charts total). Sorted by null %, descending.

Data file: `eda_missing_data.json` (new).

### Section 3 — Value distributions

Per-dataset histogram of `log10(VALUE)` for non-zero records. 2-up grid. **Reuses existing `value_distribution.json`** — no new aggregation needed.

(Note: this section duplicates content already on Data Quality. Including it here gives EDA a self-contained shape; users coming to EDA shouldn't have to bounce to another tab.)

### Section 4 — Time-series overview

Two stacked line charts:

1. **Unique countries reporting per year** — 4 lines, one per dataset.
2. **Unique species reporting per year** — 4 lines, one per dataset.

Data file: `eda_unique_per_year.json` (new).

### Section 5 — Top-N categorical breakdowns

Three horizontal bar charts:

1. **Top 10 countries by total quantity** — reuses `country_totals.json`.
2. **Top 10 species by total quantity** — reuses `species_totals.json`.
3. **Production by environment** — reuses `env_quantity.json`.

No new aggregations.

### Section 6 — Correlations / scatter

Two charts:

1. **`aquaculture_value` vs `aquaculture_quantity` scatter** — one point per country-year, log-log axes. Highlights price-vs-volume positioning per record.
2. **Top-20 country production correlation heatmap** — Pearson correlation on year-over-year total quantity for the 20 largest producers.

Data files: `eda_value_quantity_scatter.json`, `eda_country_correlation.json` (both new).

### Section 7 — Outliers

Per-dataset boxplot of `log10(VALUE)` (non-zero records), 2-up grid. Each card shows the box stats (q1, median, q3, whiskers) and an annotation: *"N outliers flagged out of M records (X%)"*, using the standard IQR rule (outlier = value outside `[q1 − 1.5·IQR, q3 + 1.5·IQR]`).

Data file: `eda_outliers.json` (new).

## Data layer — `scripts/preprocess.py` additions

All new aggregations are computed from the four CSVs already loaded at the top of `preprocess.py` (`production`, `aqua_qty`, `aqua_val`, `capture`). No new dependencies.

### `eda_summary_stats.json`

```json
[
  {
    "dataset": "global_production",
    "rows": 12345,
    "year_min": 1950, "year_max": 2024,
    "n_countries": 180, "n_species": 45,
    "mean": 1234.5, "median": 100.0, "std": 5000.0,
    "min": 0.0, "p25": 10.0, "p75": 500.0, "max": 1000000.0
  },
  ...
]
```

### `eda_missing_data.json`

```json
{
  "global_production": [
    { "column": "VALUE", "null_pct": 0.5 },
    { "column": "STATUS", "null_pct": 0.0 },
    ...
  ],
  ...
}
```

Columns to inspect per dataset: all CSV columns present in that dataset (varies — `production` has SOURCE, the aqua sets have ENVIRONMENT, etc.).

### `eda_unique_per_year.json`

```json
{
  "global_production": [
    { "year": 1950, "n_countries": 12, "n_species": 5 },
    ...
  ],
  ...
}
```

If a dataset has no species column, `n_species` is set to `null` (key always present, value null).

### `eda_value_quantity_scatter.json`

Inner-join `aqua_qty` and `aqua_val` on `(COUNTRY.UN_CODE, SPECIES.ALPHA_3_CODE, PERIOD)`. Output:

```json
[
  { "country": "China", "year": 2020, "qty": 12345.6, "value": 7890.1 },
  ...
]
```

To keep the file size reasonable, drop rows where either `qty` or `value` is null/zero.

### `eda_country_correlation.json`

Take the top 20 countries by total quantity in `production`. Build a year × country matrix of total `VALUE` (filling missing years with 0). Compute Pearson correlation between every pair. Output:

```json
{
  "countries": ["China", "Indonesia", "Philippines", ...],
  "matrix": [[1.0, 0.85, ...], ...]
}
```

### `eda_outliers.json`

For each dataset, compute boxplot stats on `log10(VALUE)` for non-zero rows:

```json
{
  "global_production": {
    "q1": 1.2, "median": 2.0, "q3": 3.1,
    "lower_whisker": -0.5, "upper_whisker": 5.6,
    "n_outliers": 1234, "total": 50000
  },
  ...
}
```

`n_outliers` counts rows with `log10(VALUE) < lower_whisker` or `> upper_whisker`.

## Frontend file layout

- **New file:** `src/tabs/EdaTab.jsx`
  - One default-exported component, structured the same way as `DataQualityTab.jsx` and `EconomicsTab.jsx`: `useData(...)` calls at the top, `useMemo` for derived data, then a tree of `ChartCard` sections.
- **Modified:**
  - `src/components/layout/Sidebar.jsx` — reorder `NAV_GROUPS`, add EDA entry.
  - `src/App.jsx` — register `eda` tab in the `TABS` map and add the lazy import.

No changes to existing tabs, charts, or shared components.

## Reuse summary

| Section | Source data | New aggregation? |
|---|---|---|
| 1. Summary stats | `eda_summary_stats.json` | ✅ new |
| 2. Missing data | `eda_missing_data.json` | ✅ new |
| 3. Value distributions | `value_distribution.json` | ❌ reused |
| 4. Time overview | `eda_unique_per_year.json` | ✅ new |
| 5. Top-N | `country_totals.json`, `species_totals.json`, `env_quantity.json` | ❌ reused |
| 6. Correlations | `eda_value_quantity_scatter.json`, `eda_country_correlation.json` | ✅ new |
| 7. Outliers | `eda_outliers.json` | ✅ new |

Six new JSON files. Five reused.

## Open considerations (not blocking)

- **Performance.** `eda_value_quantity_scatter.json` could be large (one row per country-species-year). If it exceeds ~1 MB, consider sampling or coarse aggregation. Will be measured during implementation, not designed around now.
- **Species column naming.** The four CSVs may use different species code columns. Implementation step verifies the actual column names from `dataset/*.csv`.
- **Section 3 duplication.** Value distributions appear on both Data Quality and EDA. Acceptable for now; revisit if it feels redundant after seeing it live.
