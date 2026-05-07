import Plot from 'react-plotly.js'

export default function ScatterChart({ data, xKey, yKey, labelKey, xLabel = '', yLabel = '', height = 460 }) {
  if (!data?.length) return <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
  return (
    <Plot
      data={[{
        x: data.map(d => d[xKey]),
        y: data.map(d => d[yKey]),
        text: data.map(d => d[labelKey]),
        mode: 'markers+text',
        type: 'scatter',
        textposition: 'top right',
        textfont: { size: 9 },
        marker: { size: 8, color: '#1f77b4', opacity: 0.65, line: { width: 1, color: 'white' } },
      }]}
      layout={{
        xaxis: { title: xLabel, type: 'log' },
        yaxis: { title: yLabel, type: 'log' },
        template: 'plotly_white',
        autosize: true,
        margin: { t: 10, r: 10, b: 60, l: 70 },
      }}
      useResizeHandler
      style={{ width: '100%', height: `${height}px` }}
      config={{ responsive: true, displaylogo: false }}
    />
  )
}
