import Plot from '../../lib/Plot'

/**
 * Radar (polar) chart. Compares two or more series across N qualitative
 * axes — used in the PSIA briefing to show BC's strengths/gaps against
 * the global average.
 *
 * Props:
 *   axes    – array of axis labels
 *   series  – [{ name, values, color }]
 *             values length must match axes length
 *   max     – numeric ceiling for radial axis (default 5)
 *   height  – px; defaults to 460
 */
export default function RadarChart({ axes, series, max = 5, height = 460 }) {
  if (!axes?.length || !series?.length)
    return (
      <div className="h-40 flex items-center justify-center text-slate-400">
        No data
      </div>
    )

  // Close each polygon by repeating the first point at the end.
  const closedAxes = [...axes, axes[0]]

  const traces = series.map(s => ({
    type: 'scatterpolar',
    name: s.name,
    r: [...s.values, s.values[0]],
    theta: closedAxes,
    fill: 'toself',
    fillcolor: hexToRgba(s.color, 0.18),
    line: { color: s.color, width: 2 },
    marker: { color: s.color, size: 6 },
    hovertemplate: '<b>%{theta}</b><br>%{r}<extra>' + s.name + '</extra>',
  }))

  return (
    <Plot
      data={traces}
      layout={{
        polar: {
          bgcolor: 'rgba(0,0,0,0)',
          radialaxis: {
            visible: true,
            range: [0, max],
            gridcolor: '#e2e8f0',
            linecolor: '#e2e8f0',
            tickfont: { size: 10, color: '#94a3b8' },
            angle: 90,
          },
          angularaxis: {
            gridcolor: '#e2e8f0',
            linecolor: '#cbd5e1',
            tickfont: { size: 11, color: '#475569' },
          },
        },
        legend: {
          orientation: 'h',
          y: -0.08,
          font: { size: 11, color: '#475569' },
        },
        margin: { t: 20, r: 60, b: 50, l: 60 },
      }}
      useResizeHandler
      style={{ width: '100%', height: `${height}px` }}
      config={{ responsive: true, displaylogo: false }}
    />
  )
}

/** Convert "#0d9488" (or 3-digit form) into "rgba(13,148,136,a)". */
function hexToRgba(hex, alpha) {
  let h = hex.replace('#', '')
  if (h.length === 3)
    h = h
      .split('')
      .map(c => c + c)
      .join('')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
