import Plot from '../../lib/Plot'

/**
 * Donut chart. Pie chart with a hole in the middle so we can place a
 * label or value in the center. Every slice gets a per-cell color from
 * the brand palette.
 *
 * Props:
 *   data       – [{ label, value }]
 *   colors     – array of hex strings, one per slice (cycles if shorter)
 *   centerText – optional string rendered in the donut hole
 *   height     – px; defaults to 320
 */
export default function DonutChart({
  data,
  colors = ['#0d9488', '#cbd5e1'], // brand teal + slate-300 by default
  centerText,
  height = 320,
}) {
  if (!data?.length)
    return (
      <div className="h-40 flex items-center justify-center text-slate-400">
        No data
      </div>
    )

  const sliceColors = data.map((_, i) => colors[i % colors.length])

  return (
    <Plot
      data={[
        {
          type: 'pie',
          hole: 0.62,
          values: data.map(d => d.value),
          labels: data.map(d => d.label),
          marker: { colors: sliceColors, line: { color: 'white', width: 3 } },
          textinfo: 'label+percent',
          textposition: 'outside',
          hovertemplate: '<b>%{label}</b><br>%{value}%<extra></extra>',
          sort: false,
          direction: 'clockwise',
        },
      ]}
      layout={{
        showlegend: false,
        margin: { t: 10, r: 10, b: 10, l: 10 },
        annotations: centerText
          ? [
              {
                text: centerText,
                showarrow: false,
                font: { size: 18, color: '#0f172a' },
                xref: 'paper',
                yref: 'paper',
                x: 0.5,
                y: 0.5,
              },
            ]
          : [],
      }}
      useResizeHandler
      style={{ width: '100%', height: `${height}px` }}
      config={{ responsive: true, displaylogo: false }}
    />
  )
}
