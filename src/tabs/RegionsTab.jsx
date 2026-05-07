import { useMemo } from 'react'
import { useYear } from '../context/YearContext'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import AreaChart from '../components/charts/AreaChart'

export default function RegionsTab() {
  const { yearRange: [yMin, yMax] } = useYear()

  const { data: contData,   loading: l1 } = useData('by_continent.json')
  const { data: incomeData, loading: l2 } = useData('by_income_group.json')

  const continent = useMemo(() => contData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [contData, yMin, yMax])
  const income    = useMemo(() => incomeData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [incomeData, yMin, yMax])

  if (l1 || l2) return <div className="p-12 text-center text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      <ChartCard title="Global seaweed production by continent (million tonnes)">
        <AreaChart data={continent} groupKey="continent" valueKey="value_mt" yLabel="Million tonnes" />
      </ChartCard>

      <ChartCard title="Global seaweed production by income group (million tonnes)">
        <AreaChart data={income} groupKey="income_group" valueKey="value_mt" yLabel="Million tonnes" />
      </ChartCard>
    </div>
  )
}
