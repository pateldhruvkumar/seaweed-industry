import Plot from '../../lib/Plot'

/**
 * Stacked area chart. The default Plotly behavior with `mode:'none'` paints
 * the fill at low opacity, which makes thin slices (anything under ~5%) and
 * their legend swatches almost invisible against a dominant adjacent layer.
 *
 * To fix that we:
 *   1. Use a bold, high-contrast palette tuned for stacked areas — the
 *      adjacent slices intentionally swing across the spectrum (teal →
 *      orange → blue → violet) so even a 1% slice reads cleanly next to a
 *      99% slice.
 *   2. Draw a thin top line on each layer (`mode:'lines'`) so the boundary
 *      between layers is visible and the legend renders the saturated line
 *      color rather than the faded fill.
 *   3. Set `fillcolor` explicitly with a fixed alpha so we control opacity
 *      instead of letting Plotly pick.
 */

const AREA_COLORS = [
  '#0d9488', // teal-600
  '#ea580c', // orange-600
  '#2563eb', // blue-600
  '#7c3aed', // violet-600
  '#059669', // emerald-600
  '#db2777', // pink-600
  '#0891b2', // cyan-600
  '#ca8a04', // yellow-600
]

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export default function AreaChart({
  data,
  groupKey,
  valueKey,
  yLabel = '',
  height = 400,
}) {
  if (!data?.length)
    return (
      <div className="h-40 flex items-center justify-center text-slate-400">
        No data
      </div>
    )

  const groups = [...new Set(data.map(d => d[groupKey]))].filter(Boolean)
  const years = [...new Set(data.map(d => d.year))].sort((a, b) => a - b)
  const lookup = Object.fromEntries(
    data.map(d => [`${d.year}__${d[groupKey]}`, d[valueKey]]),
  )

  const traces = groups.map((g, i) => {
    const color = AREA_COLORS[i % AREA_COLORS.length]
    return {
      x: years,
      y: years.map(y => lookup[`${y}__${g}`] ?? 0),
      name: g,
      type: 'scatter',
      mode: 'lines',
      line: { width: 1.5, color },
      fill: i === 0 ? 'tozeroy' : 'tonexty',
      fillcolor: hexToRgba(color, 0.55),
      stackgroup: 'one',
      hovertemplate: '<b>%{x}</b><br>%{y:.2f}<extra>' + g + '</extra>',
    }
  })

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
