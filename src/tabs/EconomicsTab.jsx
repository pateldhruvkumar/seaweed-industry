import { useMemo, useState } from 'react'
import { useYear } from '../context/YearContext'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import LineChart from '../components/charts/LineChart'
import ScatterChart from '../components/charts/ScatterChart'
import DataTable from '../components/DataTable'
import Dropdown from '../components/controls/Dropdown'
import { formatKt, formatUSD } from '../utils/formatters'

const WINDOW_OPTIONS = [
  { label: '2020–2024', value: '2020-2024' },
  { label: '2015–2019', value: '2015-2019' },
  { label: '2010–2014', value: '2010-2014' },
]

const TABLE_COLUMNS = [
  { key: 'species',       label: 'Species' },
  { key: 'tonnes',        label: 'Tonnes / yr',   format: v => formatKt(v / 1000) },
  { key: 'value_kusd',    label: 'Value (k USD)',  format: v => formatUSD(v * 1000) },
  { key: 'usd_per_tonne', label: 'USD / tonne',    format: v => formatUSD(v) },
]

export default function EconomicsTab() {
  const { yearRange: [yMin, yMax] } = useYear()
  const [scatterWindow, setScatterWindow] = useState('2020-2024')
  const [tableYear, setTableYear]         = useState(null)

  const { data: priceGlobal, loading: l1 } = useData('price_global.json')
  const { data: priceEnv,    loading: l2 } = useData('price_by_env.json')
  const { data: volVal,      loading: l3 } = useData('country_value_volume.json')
  const { data: specPrice,   loading: l4 } = useData('species_price_table.json')

  const pg = useMemo(() => priceGlobal?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [priceGlobal, yMin, yMax])
  const pe = useMemo(() => priceEnv?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [priceEnv, yMin, yMax])

  const [wStart, wEnd] = scatterWindow.split('-').map(Number)
  const scatter = useMemo(() =>
    volVal?.filter(d => d.year_start === wStart && d.year_end === wEnd) ?? [],
    [volVal, wStart, wEnd]
  )

  const availableYears = useMemo(() =>
    [...new Set(specPrice?.map(d => d.year) ?? [])].sort((a, b) => b - a),
    [specPrice]
  )
  const selectedYear = tableYear ?? availableYears[0] ?? null
  const tableData = useMemo(() =>
    specPrice?.filter(d => d.year === selectedYear) ?? [],
    [specPrice, selectedYear]
  )
  const yearOptions = useMemo(() =>
    availableYears.map(y => ({ label: String(y), value: String(y) })),
    [availableYears]
  )

  if (l1 || l2 || l3 || l4) return <div className="p-12 text-center text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      <ChartCard title="Global volume-weighted average aquaculture price (USD per tonne live weight)">
        <LineChart data={pg} yKey="usd_per_tonne" yLabel="USD per tonne" />
      </ChartCard>

      <ChartCard title="Average aquaculture price by farming environment (log scale, USD per tonne)">
        <LineChart data={pe} yKey="usd_per_tonne" groupKey="environment" yLabel="USD per tonne (log)" yLog />
      </ChartCard>

      <ChartCard
        title="Country positioning: average annual volume vs. value (log-log scale)"
        controls={
          <Dropdown label="Period" options={WINDOW_OPTIONS} value={scatterWindow} onChange={setScatterWindow} />
        }
      >
        <ScatterChart
          data={scatter}
          xKey="avg_tonnes"
          yKey="avg_value_musd"
          labelKey="country"
          xLabel="Average annual quantity (tonnes, log scale)"
          yLabel="Average annual value (million USD, log scale)"
        />
      </ChartCard>

      <ChartCard
        title="Highest-value species by implied unit price (USD per tonne)"
        controls={
          yearOptions.length > 0 && (
            <Dropdown
              label="Year"
              options={yearOptions}
              value={String(selectedYear)}
              onChange={v => setTableYear(+v)}
            />
          )
        }
      >
        <DataTable columns={TABLE_COLUMNS} data={tableData} />
      </ChartCard>
    </div>
  )
}
