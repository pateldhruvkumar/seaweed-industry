/**
 * Centralized chart palette + helpers. Mirrors the intent of the old
 * plotlyTheme.js — Inter font, brand teal first, quiet slate gridlines.
 *
 * Colors are referenced via hsl(var(--chart-N)) CSS variables defined in
 * index.css so the same palette is available to CSS and JS.
 */

export const PLOT_COLORS = [
  '#0d9488', // chart-1  teal-600 (brand)
  '#0891b2', // chart-2  cyan-600
  '#3b82f6', // chart-3  blue-500
  '#6366f1', // chart-4  indigo-500
  '#8b5cf6', // chart-5  violet-500
  '#ec4899', // chart-6  pink-500
  '#f59e0b', // chart-7  amber-500
  '#84cc16', // chart-8  lime-500
  '#06b6d4', // chart-9  cyan-500
  '#10b981', // chart-10 emerald-500
]

export const AREA_COLORS = [
  '#0d9488', // teal-600
  '#ea580c', // orange-600
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#059669', // emerald-600
  '#db2777', // pink-600
  '#0891b2', // cyan-600
  '#ca8a04', // yellow-600
]

export const GRID_COLOR = '#f1f5f9'   // slate-100
export const AXIS_COLOR = '#94a3b8'   // slate-400
export const TICK_COLOR = '#64748b'   // slate-500

/** Build a Recharts-ready axis style block. */
export const axisProps = {
  stroke: '#e2e8f0',
  tick: { fill: TICK_COLOR, fontSize: 11 },
  tickLine: { stroke: '#e2e8f0' },
  axisLine: { stroke: '#e2e8f0' },
}

/** Build a ChartContainer config from a list of series names. */
export function buildSeriesConfig(names, palette = PLOT_COLORS) {
  const out = {}
  names.forEach((name, i) => {
    out[name] = { label: name, color: palette[i % palette.length] }
  })
  return out
}
