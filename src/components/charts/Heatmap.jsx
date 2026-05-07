import Plot from 'react-plotly.js'

export default function Heatmap({ data, height = 460 }) {
  if (!data) return <div className="h-40 flex items-center justify-center text-gray-400">No data</div>
  const { countries, species, values } = data
  return (
    <Plot
      data={[{
        z: values,
        x: species,
        y: countries,
        type: 'heatmap',
        colorscale: 'YlGnBu',
        hoverongaps: false,
        text: values.map(row => row.map(v => v.toFixed(0))),
        texttemplate: '%{text}',
        colorbar: { title: 'K t/yr' },
      }]}
      layout={{
        xaxis: { title: 'Species / group', tickangle: -30 },
        yaxis: { title: 'Country', autorange: 'reversed' },
        template: 'plotly_white',
        autosize: true,
        margin: { t: 10, r: 20, b: 120, l: 150 },
      }}
      useResizeHandler
      style={{ width: '100%', height: `${height}px` }}
      config={{ responsive: true, displaylogo: false }}
    />
  )
}
