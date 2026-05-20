import {
  LineChart as RechartsLineChart,
  Line,
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
import { PLOT_COLORS, GRID_COLOR, axisProps, buildSeriesConfig } from '../../lib/chartTheme'

export default function LineChart({
  data, xKey = 'year', yKey, groupKey,
  yLabel = '', yLog = false, height = 380,
}) {
  if (!data?.length)
    return <div className="h-40 flex items-center justify-center text-slate-400">No data</div>

  let rows
  let groups
  if (groupKey) {
    groups = [...new Set(data.map(d => d[groupKey]))].filter(Boolean)
    const xs = [...new Set(data.map(d => d[xKey]))].sort((a, b) => a - b)
    const lookup = Object.fromEntries(
      data.map(d => [`${d[xKey]}__${d[groupKey]}`, d[yKey]]),
    )
    rows = xs.map(x => {
      const row = { [xKey]: x }
      groups.forEach(g => { row[g] = lookup[`${x}__${g}`] ?? null })
      return row
    })
  } else {
    groups = [yKey]
    rows = [...data].sort((a, b) => a[xKey] - b[xKey])
  }

  const config = buildSeriesConfig(groups)

  return (
    <ChartContainer config={config} className="aspect-auto" style={{ height: `${height}px`, width: '100%' }}>
      <RechartsLineChart data={rows} margin={{ top: 10, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} label={{ value: 'Year', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }} />
        <YAxis
          {...axisProps}
          scale={yLog ? 'log' : 'auto'}
          domain={yLog ? ['auto', 'auto'] : undefined}
          allowDataOverflow={yLog}
          label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 } : undefined}
        />
        <ChartTooltip cursor={{ stroke: '#e2e8f0' }} content={<ChartTooltipContent />} />
        {groupKey && <Legend content={<ChartLegendContent />} />}
        {groups.map((g, i) => (
          <Line
            key={g}
            type="monotone"
            dataKey={g}
            stroke={PLOT_COLORS[i % PLOT_COLORS.length]}
            strokeWidth={groupKey ? 2 : 2.5}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
            connectNulls
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  )
}
