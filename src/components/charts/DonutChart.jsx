import { PieChart, Pie, Cell, Label } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart'

/**
 * Donut chart. PieChart with an inner hole so we can place a label or
 * value in the center. Per-slice colors come from `colors`, cycling if
 * shorter than `data`.
 *
 * Props match the legacy version: { data, colors, centerText, height }.
 */
export default function DonutChart({
  data,
  colors = ['#0d9488', '#cbd5e1'],
  centerText,
  height = 320,
}) {
  if (!data?.length)
    return <div className="h-40 flex items-center justify-center text-slate-400">No data</div>

  const total = data.reduce((s, d) => s + (d.value ?? 0), 0)
  const rows = data.map(d => ({
    ...d,
    pct: total ? ((d.value / total) * 100).toFixed(1) : '0',
  }))

  return (
    <ChartContainer config={{}} className="aspect-auto" style={{ height: `${height}px`, width: '100%' }}>
      <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <ChartTooltip
          content={<ChartTooltipContent hideLabel valueFormatter={v => `${v}%`} />}
        />
        <Pie
          data={rows}
          dataKey="value"
          nameKey="label"
          innerRadius="62%"
          outerRadius="92%"
          stroke="white"
          strokeWidth={3}
          paddingAngle={0}
          isAnimationActive={false}
          label={({ label, pct }) => `${label} ${pct}%`}
          labelLine={false}
        >
          {rows.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
          {centerText && (
            <Label
              value={centerText}
              position="center"
              style={{ fill: '#0f172a', fontSize: 18, fontWeight: 600 }}
            />
          )}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
