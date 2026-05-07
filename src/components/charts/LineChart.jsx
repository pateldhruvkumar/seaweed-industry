import Plot from '../../lib/Plot'

export default function LineChart({
  data, xKey = 'year', yKey, groupKey,
  yLabel = '', yLog = false, height = 380,
}) {
  if (!data?.length) return <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
  let traces
  if (groupKey) {
    const groups = [...new Set(data.map(d => d[groupKey]))].filter(Boolean)
    traces = groups.map(g => {
      const rows = data.filter(d => d[groupKey] === g).sort((a, b) => a[xKey] - b[xKey])
      return { x: rows.map(d => d[xKey]), y: rows.map(d => d[yKey]), name: g,
               type: 'scatter', mode: 'lines', line: { width: 2 } }
    })
  } else {
    const rows = [...data].sort((a, b) => a[xKey] - b[xKey])
    traces = [{ x: rows.map(d => d[xKey]), y: rows.map(d => d[yKey]),
                type: 'scatter', mode: 'lines', line: { width: 2.5, color: '#0d9488' } }]
  }
  return (
    <Plot
      data={traces}
      layout={{
        yaxis: { title: yLabel, type: yLog ? 'log' : 'linear', fixedrange: false },
        xaxis: { title: 'Year' },
        template: 'plotly_white',
        autosize: true,
        margin: { t: 10, r: 10, b: 50, l: 70 },
        legend: { orientation: 'h', y: -0.2 },
      }}
      useResizeHandler
      style={{ width: '100%', height: `${height}px` }}
      config={{ responsive: true, displaylogo: false }}
    />
  )
}
