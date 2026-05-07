import Plot from 'react-plotly.js'

export default function AreaChart({ data, groupKey, valueKey, yLabel = '', height = 400 }) {
  if (!data?.length) return <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
  const groups = [...new Set(data.map(d => d[groupKey]))].filter(Boolean)
  const years  = [...new Set(data.map(d => d.year))].sort((a, b) => a - b)
  const lookup = Object.fromEntries(data.map(d => [`${d.year}__${d[groupKey]}`, d[valueKey]]))
  const traces = groups.map(g => ({
    x: years,
    y: years.map(y => lookup[`${y}__${g}`] ?? 0),
    name: g,
    type: 'scatter',
    mode: 'none',
    fill: 'tonexty',
    stackgroup: 'one',
  }))
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
