import { useData } from '../hooks/useData'
import TimeFilteredChartCard from '../components/TimeFilteredChartCard'
import AreaChart from '../components/charts/AreaChart'

export default function RegionsTab() {
  const { data: contData,   loading: l1 } = useData('by_continent.json')
  const { data: incomeData, loading: l2 } = useData('by_income_group.json')

  if (l1 || l2)
    return <div className="p-12 text-center text-slate-400">Loading…</div>

  return (
    <div className="space-y-6">
      <TimeFilteredChartCard title="Global seaweed production by continent (million tonnes)">
        {([yMin, yMax]) => (
          <AreaChart
            data={contData.filter(d => d.year >= yMin && d.year <= yMax)}
            groupKey="continent"
            valueKey="value_mt"
            yLabel="Million tonnes"
          />
        )}
      </TimeFilteredChartCard>

      <TimeFilteredChartCard title="Global seaweed production by income group (million tonnes)">
        {([yMin, yMax]) => (
          <AreaChart
            data={incomeData.filter(d => d.year >= yMin && d.year <= yMax)}
            groupKey="income_group"
            valueKey="value_mt"
            yLabel="Million tonnes"
          />
        )}
      </TimeFilteredChartCard>
    </div>
  )
}
