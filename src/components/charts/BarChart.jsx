import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LabelList,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart'
import { GRID_COLOR, axisProps } from '../../lib/chartTheme'
import { formatCompact, formatFull } from '../../utils/formatters'

/**
 * Generic bar chart. Horizontal by default (good for ranked categorical
 * lists); pass orientation="vertical" for column charts.
 *
 * Props match the legacy Plotly version so callers don't change:
 *   data, labelKey, valueKey, colorKey, color, orientation,
 *   sort, xLabel, yLabel, showLabels, format, xDtick, yDtick, height
 *
 * Without an explicit `format`, bar labels abbreviate (K/M/B) while the
 * tooltip shows the exact value; a caller-supplied `format` applies to both.
 */

export default function BarChart({
  data,
  labelKey,
  valueKey,
  colorKey,
  color = '#0d9488',
  orientation = 'horizontal',
  sort,
  xLabel = '',
  yLabel = '',
  showLabels = true,
  format,
  xDtick,
  yDtick,
  height = 420,
}) {
  if (!data?.length)
    return <div className="h-40 flex items-center justify-center text-slate-400">No data</div>

  const isHorizontal = orientation === 'horizontal'
  const sortMode = sort ?? (isHorizontal ? 'asc' : 'none')

  let rows = data.filter(d => d[valueKey] != null && !isNaN(d[valueKey]))
  if (sortMode === 'asc') rows = [...rows].sort((a, b) => a[valueKey] - b[valueKey])
  if (sortMode === 'desc') rows = [...rows].sort((a, b) => b[valueKey] - a[valueKey])

  const xDomain = xDtick != null ? [0, undefined] : undefined
  const yDomain = yDtick != null ? [0, undefined] : undefined

  const labelFormat = format || formatCompact
  const tooltipFormat = format || formatFull

  return (
    <ChartContainer config={{}} className="aspect-auto" style={{ height: `${height}px`, width: '100%' }}>
      <RechartsBarChart
        data={rows}
        layout={isHorizontal ? 'vertical' : 'horizontal'}
        margin={isHorizontal ? { top: 8, right: 60, bottom: 24, left: 24 } : { top: 16, right: 16, bottom: 24, left: 24 }}
      >
        <CartesianGrid stroke={GRID_COLOR} horizontal={!isHorizontal} vertical={isHorizontal} />
        {isHorizontal ? (
          <>
            <XAxis type="number" {...axisProps} tickFormatter={formatCompact} domain={xDomain} interval={xDtick != null ? 0 : 'preserveEnd'}
                   label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -8, fill: '#64748b', fontSize: 11 } : undefined} />
            <YAxis type="category" dataKey={labelKey} {...axisProps} width={150} interval={0} />
          </>
        ) : (
          <>
            <XAxis type="category" dataKey={labelKey} {...axisProps} interval={0} />
            <YAxis type="number" {...axisProps} tickFormatter={formatCompact} domain={yDomain}
                   label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 } : undefined} />
          </>
        )}
        <ChartTooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltipContent valueFormatter={tooltipFormat} hideLabel={isHorizontal ? false : false} />} />
        <Bar dataKey={valueKey} fill={color} radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
          {rows.map((row, i) => (
            <Cell key={i} fill={colorKey ? row[colorKey] || color : color} />
          ))}
          {showLabels && (
            <LabelList
              dataKey={valueKey}
              position={isHorizontal ? 'right' : 'top'}
              formatter={labelFormat}
              style={{ fill: '#475569', fontSize: 11 }}
            />
          )}
        </Bar>
      </RechartsBarChart>
    </ChartContainer>
  )
}
