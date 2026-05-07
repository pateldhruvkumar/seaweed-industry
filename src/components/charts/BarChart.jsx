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
 *   xLabel      – axis title for the value axis
 *   showLabels  – render value labels next to bars (default true)
 *   format      – function to format value labels (default toFixed(0))
 *   height      – px; defaults to 420
 */
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
  format = v => Number(v).toFixed(0),
  height = 420,
}) {
  if (!data?.length)
    return (
      <div className="h-40 flex items-center justify-center text-slate-400">
        No data
      </div>
    )

  const sortMode = sort ?? (orientation === 'horizontal' ? 'asc' : 'none')
  let rows = data.filter(
    d => d[valueKey] != null && !isNaN(d[valueKey]),
  )
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
        },
        yaxis: {
          title: isHorizontal ? '' : yLabel,
          tickfont: { size: 11 },
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
