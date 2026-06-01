import { useData } from '../hooks/useData'
import VolumeTimeChartCard from '../components/VolumeTimeChartCard'
import AreaChart from '../components/charts/AreaChart'

export default function RegionsTab() {
  const { data: contData,   loading: l1 } = useData('by_continent.json')
  const { data: incomeData, loading: l2 } = useData('by_income_group.json')

  if (l1 || l2)
    return <div className="p-12 text-center text-slate-400">Loading…</div>

  return (
    <div className="space-y-6">
      <VolumeTimeChartCard title="Global seaweed production by continent">
        {([yMin, yMax], factor, volLabel) => (
          <AreaChart
            data={contData
              .filter(d => d.year >= yMin && d.year <= yMax)
              .map(d => ({ ...d, value_mt: d.value_mt * factor }))}
            groupKey="continent"
            valueKey="value_mt"
            yLabel={volLabel}
          />
        )}
      </VolumeTimeChartCard>

      <VolumeTimeChartCard title="Global seaweed production by income group">
        {([yMin, yMax], factor, volLabel) => (
          <AreaChart
            data={incomeData
              .filter(d => d.year >= yMin && d.year <= yMax)
              .map(d => ({ ...d, value_mt: d.value_mt * factor }))}
            groupKey="income_group"
            valueKey="value_mt"
            yLabel={volLabel}
          />
        )}
      </VolumeTimeChartCard>
    </div>
  )
}
