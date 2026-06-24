import {
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart'
import { GRID_COLOR, axisProps } from '../../lib/chartTheme'
import { formatCompact, formatFull } from '../../utils/formatters'

/**
 * Domain + gridline ticks for a log axis. Recharts' default `['auto','auto']`
 * pins the bounds to the exact data min/max, so the most extreme point (and
 * its label) lands right on the plot edge and gets clipped — e.g. China, the
 * top-right corner point on the country-positioning scatter. Rounding the
 * bounds outward to the nearest power of 10 (with a fractional-decade margin)
 * keeps every point inside the plot with breathing room for its label and
 * yields clean power-of-10 gridlines.
 *
 * Point labels render *above* their marker, so headroom is only needed at the
 * high end and the horizontal edges — hence the asymmetric padLo/padHi.
 */
function logAxis(values, { padLo = 0.2, padHi = 0.2 } = {}) {
  const positive = values.filter(v => v > 0)
  if (!positive.length) return { domain: ['auto', 'auto'], ticks: undefined }
  const lo = Math.floor(Math.log10(Math.min(...positive)) - padLo)
  const hi = Math.ceil(Math.log10(Math.max(...positive)) + padHi)
  const ticks = []
  for (let e = lo; e <= hi; e++) ticks.push(10 ** e)
  return { domain: [10 ** lo, 10 ** hi], ticks }
}

export default function ScatterChart({
  data, xKey, yKey, labelKey, xLabel = '', yLabel = '', height = 460,
}) {
  if (!data?.length)
    return <div className="h-40 flex items-center justify-center text-slate-400">No data</div>

  const points = data
    .filter(d => d[xKey] > 0 && d[yKey] > 0)
    .map(d => ({ x: d[xKey], y: d[yKey], label: d[labelKey] }))

  // X labels can spill off either side; Y labels only spill upward, so the
  // bottom of the value axis stays at its natural floor (no spurious 0 tick).
  const xAxis = logAxis(points.map(p => p.x), { padLo: 0.2, padHi: 0.2 })
  const yAxis = logAxis(points.map(p => p.y), { padLo: 0, padHi: 0.2 })

  return (
    <ChartContainer config={{}} className="aspect-auto" style={{ height: `${height}px`, width: '100%' }}>
      <RechartsScatterChart margin={{ top: 16, right: 28, bottom: 24, left: 8 }}>
        <CartesianGrid stroke={GRID_COLOR} />
        <XAxis
          type="number"
          dataKey="x"
          {...axisProps}
          tickFormatter={formatCompact}
          scale="log"
          domain={xAxis.domain}
          ticks={xAxis.ticks}
          label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -8, fill: '#64748b', fontSize: 11 } : undefined}
        />
        <YAxis
          type="number"
          dataKey="y"
          {...axisProps}
          tickFormatter={formatCompact}
          scale="log"
          domain={yAxis.domain}
          ticks={yAxis.ticks}
          label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11, style: { textAnchor: 'middle' } } : undefined}
        />
        <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent hideLabel valueFormatter={formatFull} />} />
        <Scatter data={points} fill="#1f77b4" fillOpacity={0.65} isAnimationActive={false}>
          <LabelList dataKey="label" position="top" style={{ fill: '#475569', fontSize: 9 }} />
        </Scatter>
      </RechartsScatterChart>
    </ChartContainer>
  )
}
