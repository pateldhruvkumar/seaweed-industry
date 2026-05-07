import Plot from 'react-plotly.js'

export default function BarChart({ data, labelKey, valueKey, xLabel = '', height = 420 }) {
  if (!data?.length) return <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
  const sorted = [...data].sort((a, b) => a[valueKey] - b[valueKey])
  return (
    <Plot
      data={[{
        x: sorted.map(d => d[valueKey]),
        y: sorted.map(d => d[labelKey]),
        type: 'bar',
        orientation: 'h',
        marker: { color: '#0d9488' },
        text: sorted.map(d => Number(d[valueKey]).toFixed(2)),
        textposition: 'outside',
      }]}
      layout={{
        xaxis: { title: xLabel },
        template: 'plotly_white',
        autosize: true,
        margin: { t: 10, r: 80, b: 50, l: 160 },
      }}
      useResizeHandler
      style={{ width: '100%', height: `${height}px` }}
      config={{ responsive: true, displaylogo: false }}
    />
  )
}
