import Plot from '../../lib/Plot'

/**
 * Generic bar chart. Defaults to a horizontal layout (good for ranked
 * categorical lists), but accepts orientation="vertical" for column
 * charts where the X axis is the category.
 *
 * Per-bar coloring is supported via the `colorKey` prop — pass the name
 * of a row field whose value is a hex string, and each bar takes that
 * color individually. Fall back to the brand teal otherwise.
 *
 * Props:
 *   data        – array of rows
 *   labelKey    – field for category label
 *   valueKey    – field for numeric value
 *   colorKey    – optional field whose value is a hex color (per-bar)
 *   color       – fallback single color (default brand teal)
 *   orientation – 'horizontal' (default) or 'vertical'
 *   sort        – 'asc' | 'desc' | 'none' (default 'asc' for h, 'none' for v)
 *   xLabel      – axis title for the X axis
 *   yLabel      – axis title for the Y axis
 *   showLabels  – render value labels next to bars (default true)
 *   format      – fn to format value labels (default scale-adaptive)
 *   xDtick      – fixed tick interval on the X axis (number)
 *   yDtick      – fixed tick interval on the Y axis (number)
 *   height      – px; defaults to 420
 */

/**
 * Scale-adaptive default label formatter. Picks decimal precision based
 * on magnitude so a 0.2137 row doesn't render as "0" while a 13,000 row
 * doesn't render as "13000.00".
 */
function defaultFormat(v) {
  const n = Number(v)
  if (!Number.isFinite(n) || n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 1000) return Math.round(n).toLocaleString()
  if (abs >= 100) return Math.round(n).toLocaleString()
  if (abs >= 10) return n.toFixed(1)
  if (abs >= 1) return n.toFixed(2)
  return n.toFixed(2) // sub-unit values: keep 2 decimals (e.g. 0.21)
}

export default function BarChart({
  data,
  labelKey,
  valueKey,
  colorKey,
  color = '#0d9488',
  orientation = 'horizontal',
  sort,
  xLabel = '',
  yLabel = '',
  showLabels = true,
  format = defaultFormat,
  xDtick,
  yDtick,
  height = 420,
}) {
  if (!data?.length)
    return (
      <div className="h-40 flex items-center justify-center text-slate-400">
        No data
      </div>
    )

  const sortMode = sort ?? (orientation === 'horizontal' ? 'asc' : 'none')
  let rows = data.filter(d => d[valueKey] != null && !isNaN(d[valueKey]))
  if (sortMode === 'asc') rows = [...rows].sort((a, b) => a[valueKey] - b[valueKey])
  if (sortMode === 'desc') rows = [...rows].sort((a, b) => b[valueKey] - a[valueKey])

  const values = rows.map(d => d[valueKey])
  const labels = rows.map(d => d[labelKey])
  const colors = colorKey ? rows.map(d => d[colorKey] || color) : color
  const labelText = showLabels ? rows.map(d => format(d[valueKey])) : []

  const isHorizontal = orientation === 'horizontal'
  const trace = isHorizontal
    ? {
        x: values,
        y: labels,
        orientation: 'h',
        type: 'bar',
        marker: { color: colors },
        text: labelText,
        textposition: 'outside',
        cliponaxis: false,
      }
    : {
        x: labels,
        y: values,
        type: 'bar',
        marker: { color: colors },
        text: labelText,
        textposition: 'outside',
        cliponaxis: false,
      }

  return (
    <Plot
      data={[trace]}
      layout={{
        xaxis: {
          title: isHorizontal ? xLabel : '',
          tickfont: { size: 11 },
          // Force a fixed tick interval when caller passes xDtick — useful
          // for ranked lists where small values need to be readable next to
          // very large ones.
          ...(xDtick != null ? { dtick: xDtick, tick0: 0 } : {}),
        },
        yaxis: {
          title: isHorizontal ? '' : yLabel,
          tickfont: { size: 11 },
          ...(yDtick != null ? { dtick: yDtick, tick0: 0 } : {}),
        },
        margin: isHorizontal
          ? { t: 10, r: 80, b: 50, l: 160 }
          : { t: 30, r: 20, b: 60, l: 70 },
        bargap: 0.35,
      }}
      useResizeHandler
      style={{ width: '100%', height: `${height}px` }}
      config={{ responsive: true, displaylogo: false }}
    />
  )
}
