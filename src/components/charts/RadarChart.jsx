import {
  RadarChart as RechartsRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegendContent } from '../ui/chart'

/**
 * Radar (polar) chart. Compares two or more series across N qualitative
 * axes — used in the PSIA briefing to show BC's strengths/gaps against
 * the global average.
 *
 * Props (preserved from legacy):
 *   axes   – array of axis labels
 *   series – [{ name, values, color }]
 *   max    – numeric ceiling for radial axis (default 5)
 *   height – px; defaults to 460
 */
export default function RadarChart({ axes, series, max = 5, height = 460 }) {
  if (!axes?.length || !series?.length)
    return <div className="h-40 flex items-center justify-center text-slate-400">No data</div>

  // Recharts radar wants one row per axis with a column per series.
  const rows = axes.map((axis, i) => {
    const row = { axis }
    series.forEach(s => { row[s.name] = s.values[i] })
    return row
  })

  const config = Object.fromEntries(
    series.map(s => [s.name, { label: s.name, color: s.color }]),
  )

  return (
    <ChartContainer config={config} className="aspect-auto" style={{ height: `${height}px`, width: '100%' }}>
      <RechartsRadarChart data={rows} margin={{ top: 20, right: 40, bottom: 40, left: 40 }}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: '#475569', fontSize: 11 }} />
        <PolarRadiusAxis
          domain={[0, max]}
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          axisLine={false}
          tickCount={6}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Legend content={<ChartLegendContent />} />
        {series.map(s => (
          <Radar
            key={s.name}
            name={s.name}
            dataKey={s.name}
            stroke={s.color}
            fill={s.color}
            fillOpacity={0.18}
            strokeWidth={2}
            isAnimationActive={false}
          />
        ))}
      </RechartsRadarChart>
    </ChartContainer>
  )
}
