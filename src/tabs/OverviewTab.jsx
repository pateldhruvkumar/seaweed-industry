import { useMemo } from 'react'
import { useYear } from '../context/YearContext'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import AreaChart from '../components/charts/AreaChart'
import LineChart from '../components/charts/LineChart'

export default function OverviewTab() {
  const { yearRange: [yMin, yMax] } = useYear()

  const { data: prodData,    loading: l1 } = useData('global_production_by_source.json')
  const { data: shareData,   loading: l2 } = useData('aquaculture_share.json')
  const { data: captureData, loading: l3 } = useData('capture_vs_aquaculture.json')

  const prod    = useMemo(() => prodData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [prodData, yMin, yMax])
  const share   = useMemo(() => shareData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [shareData, yMin, yMax])
  const cap     = useMemo(() => captureData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [captureData, yMin, yMax])

  if (l1 || l2 || l3) return <div className="p-12 text-center text-gray-400">Loading…</div>

  const capLinear = cap.flatMap(d => [
    { year: d.year, series: 'Capture',      value: d.capture_mt },
    { year: d.year, series: 'Aquaculture',  value: d.aquaculture_mt },
  ])

  return (
    <div className="space-y-6">
      <ChartCard title="Global seaweed production by source, 1950–2024 (million tonnes live weight)">
        <AreaChart data={prod} groupKey="source" valueKey="value_mt" yLabel="Million tonnes" />
      </ChartCard>

      <ChartCard title="Aquaculture as a share of global seaweed production (%)">
        <LineChart data={share} yKey="share_pct" yLabel="% of total tonnage" />
      </ChartCard>

      <ChartCard title="Capture vs. aquaculture — linear scale (million tonnes)">
        <LineChart data={capLinear} yKey="value" groupKey="series" yLabel="Million tonnes / year" />
      </ChartCard>

      <ChartCard title="Capture vs. aquaculture — log scale (reveals early aquaculture growth)">
        <LineChart data={capLinear} yKey="value" groupKey="series" yLabel="Million tonnes / year (log)" yLog />
      </ChartCard>
    </div>
  )
}
