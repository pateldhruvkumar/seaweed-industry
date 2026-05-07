/**
 * Centralized Plotly defaults. Applied to every chart via lib/Plot.jsx so
 * individual chart components don't need to know about theme details — they
 * just specify the data shape and any chart-specific layout overrides.
 *
 * Design goals:
 *   - Inherit page typography (Inter)
 *   - Quiet gridlines (slate-100) so traces dominate
 *   - Coordinated, multi-hue color cycle that includes the brand teal
 *   - Crisp hover labels matching the rest of the UI
 */

const SLATE_100 = '#f1f5f9'
const SLATE_200 = '#e2e8f0'
const SLATE_500 = '#64748b'
const SLATE_600 = '#475569'
const SLATE_900 = '#0f172a'

// 10-color cycle. Teal first (brand), then a balanced spectrum for stacked
// areas / multi-line charts.
export const PLOT_COLORS = [
  '#0d9488', // teal-600
  '#0891b2', // cyan-600
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
  '#84cc16', // lime-500
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
]

const FONT_FAMILY =
  'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

export const DEFAULT_LAYOUT = {
  font: { family: FONT_FAMILY, size: 12, color: SLATE_600 },
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  colorway: PLOT_COLORS,
  margin: { t: 10, r: 16, b: 50, l: 64 },
  xaxis: {
    gridcolor: SLATE_100,
    linecolor: SLATE_200,
    zerolinecolor: SLATE_200,
    tickfont: { color: SLATE_500, size: 11 },
    title: { font: { size: 11, color: SLATE_500 }, standoff: 8 },
    automargin: true,
  },
  yaxis: {
    gridcolor: SLATE_100,
    linecolor: SLATE_200,
    zerolinecolor: SLATE_200,
    tickfont: { color: SLATE_500, size: 11 },
    title: { font: { size: 11, color: SLATE_500 }, standoff: 8 },
    automargin: true,
  },
  hoverlabel: {
    bgcolor: 'white',
    bordercolor: SLATE_200,
    font: { family: FONT_FAMILY, size: 12, color: SLATE_900 },
  },
  legend: {
    font: { size: 11, color: SLATE_600 },
    bgcolor: 'rgba(255,255,255,0)',
    itemsizing: 'constant',
  },
}

export const DEFAULT_CONFIG = {
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
  toImageButtonOptions: { format: 'png', scale: 2 },
}

/**
 * Deep-merge a chart's layout overrides on top of the theme defaults.
 * Only the axes / font / legend / hoverlabel sub-objects need real merging;
 * everything else is fine with a flat shallow merge.
 */
export function mergeLayout(layout = {}) {
  return {
    ...DEFAULT_LAYOUT,
    ...layout,
    font: { ...DEFAULT_LAYOUT.font, ...(layout.font || {}) },
    margin: { ...DEFAULT_LAYOUT.margin, ...(layout.margin || {}) },
    xaxis: {
      ...DEFAULT_LAYOUT.xaxis,
      ...(layout.xaxis || {}),
      title:
        typeof layout?.xaxis?.title === 'string'
          ? { ...DEFAULT_LAYOUT.xaxis.title, text: layout.xaxis.title }
          : { ...DEFAULT_LAYOUT.xaxis.title, ...(layout?.xaxis?.title || {}) },
    },
    yaxis: {
      ...DEFAULT_LAYOUT.yaxis,
      ...(layout.yaxis || {}),
      title:
        typeof layout?.yaxis?.title === 'string'
          ? { ...DEFAULT_LAYOUT.yaxis.title, text: layout.yaxis.title }
          : { ...DEFAULT_LAYOUT.yaxis.title, ...(layout?.yaxis?.title || {}) },
    },
    legend: { ...DEFAULT_LAYOUT.legend, ...(layout.legend || {}) },
    hoverlabel: { ...DEFAULT_LAYOUT.hoverlabel, ...(layout.hoverlabel || {}) },
  }
}

export function mergeConfig(config = {}) {
  return { ...DEFAULT_CONFIG, ...config }
}
