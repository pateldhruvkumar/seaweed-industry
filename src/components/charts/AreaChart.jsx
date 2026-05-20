import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
} from '../ui/chart'
import { AREA_COLORS, GRID_COLOR, axisProps, buildSeriesConfig } from '../../lib/chartTheme'

/**
 * Stacked area chart with a bold, high-contrast palette tuned so adjacent
 * slices stay readable even when one dominates (e.g. 99% / 1%).
 */
export default function AreaChart({
  data,
  groupKey,
  valueKey,
  yLabel = '',
  height = 400,
}) {
  if (!data?.length)
    return <div className="h-40 flex items-center justify-center text-slate-400">No data</div>

  const groups = [...new Set(data.map(d => d[groupKey]))].filter(Boolean)
  const years = [...new Set(data.map(d => d.year))].sort((a, b) => a - b)
  const lookup = Object.fromEntries(
    data.map(d => [`${d.year}__${d[groupKey]}`, d[valueKey]]),
  )

  const rows = years.map(y => {
    const row = { year: y }
    groups.forEach(g => { row[g] = lookup[`${y}__${g}`] ?? 0 })
    return row
  })

  const config = buildSeriesConfig(groups, AREA_COLORS)

  return (
    <ChartContainer config={config} className="aspect-auto" style={{ height: `${height}px`, width: '100%' }}>
      <RechartsAreaChart data={rows} margin={{ top: 10, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="year" {...axisProps} label={{ value: 'Year', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }} />
        <YAxis
          {...axisProps}
          label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 } : undefined}
        />
        <ChartTooltip cursor={{ stroke: '#e2e8f0' }} content={<ChartTooltipContent />} />
        <Legend content={<ChartLegendContent />} />
        {groups.map((g, i) => {
          const color = AREA_COLORS[i % AREA_COLORS.length]
          return (
            <Area
              key={g}
              type="monotone"
              dataKey={g}
              stackId="one"
              stroke={color}
              strokeWidth={1.5}
              fill={color}
              fillOpacity={0.55}
              isAnimationActive={false}
            />
          )
        })}
      </RechartsAreaChart>
    </ChartContainer>
  )
}
