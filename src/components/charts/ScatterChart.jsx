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

export default function ScatterChart({
  data, xKey, yKey, labelKey, xLabel = '', yLabel = '', height = 460,
}) {
  if (!data?.length)
    return <div className="h-40 flex items-center justify-center text-slate-400">No data</div>

  const points = data
    .filter(d => d[xKey] > 0 && d[yKey] > 0)
    .map(d => ({ x: d[xKey], y: d[yKey], label: d[labelKey] }))

  return (
    <ChartContainer config={{}} className="aspect-auto" style={{ height: `${height}px`, width: '100%' }}>
      <RechartsScatterChart margin={{ top: 10, right: 16, bottom: 24, left: 8 }}>
        <CartesianGrid stroke={GRID_COLOR} />
        <XAxis
          type="number"
          dataKey="x"
          {...axisProps}
          scale="log"
          domain={['auto', 'auto']}
          allowDataOverflow
          label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -8, fill: '#64748b', fontSize: 11 } : undefined}
        />
        <YAxis
          type="number"
          dataKey="y"
          {...axisProps}
          scale="log"
          domain={['auto', 'auto']}
          allowDataOverflow
          label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 } : undefined}
        />
        <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent hideLabel />} />
        <Scatter data={points} fill="#1f77b4" fillOpacity={0.65} isAnimationActive={false}>
          <LabelList dataKey="label" position="top" style={{ fill: '#475569', fontSize: 9 }} />
        </Scatter>
      </RechartsScatterChart>
    </ChartContainer>
  )
}
