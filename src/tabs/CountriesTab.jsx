import { useMemo, useState } from 'react'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import TimeFilteredChartCard from '../components/TimeFilteredChartCard'
import BarChart from '../components/charts/BarChart'
import LineChart from '../components/charts/LineChart'
import Dropdown from '../components/controls/Dropdown'
import MultiSelect from '../components/controls/MultiSelect'

const WINDOW_OPTIONS = [
  { label: '2020–2024', value: '2020-2024' },
  { label: '2015–2019', value: '2015-2019' },
  { label: '2010–2014', value: '2010-2014' },
  { label: '2000–2004', value: '2000-2004' },
  { label: '1990–1994', value: '1990-1994' },
  { label: '1970–1974', value: '1970-1974' },
]

const TOP_N_OPTIONS = [
  { label: 'Top 10', value: '10' },
  { label: 'Top 15', value: '15' },
  { label: 'Top 20', value: '20' },
]

export default function CountriesTab() {
  const [window, setWindow] = useState('2020-2024')
  const [topN, setTopN] = useState('15')
  const [selected, setSelected] = useState([])

  const { data: totalsData, loading: l1 } = useData('country_totals.json')
  const { data: tsData, loading: l2 } = useData('country_timeseries.json')

  const [winStart, winEnd] = window.split('-').map(Number)

  // Top-N bar uses a "Period" dropdown rather than a year slider — the
  // chart's whole point is to compare a single 5-year window's averages.
  const barData = useMemo(() => {
    if (!totalsData) return []
    return totalsData
      .filter(d => d.year_start === winStart && d.year_end === winEnd)
      .sort((a, b) => b.avg_tonnes_mt - a.avg_tonnes_mt)
      .slice(0, +topN)
  }, [totalsData, winStart, winEnd, topN])

  const allCountries = useMemo(
    () => [...new Set(tsData?.map(d => d.country) ?? [])].sort(),
    [tsData],
  )

  const defaultTop5 = useMemo(() => {
    if (!totalsData) return []
    return totalsData
      .filter(d => d.year_start === winStart && d.year_end === winEnd)
      .sort((a, b) => b.avg_tonnes_mt - a.avg_tonnes_mt)
      .slice(0, 5)
      .map(d => d.country)
  }, [totalsData, winStart, winEnd])

  const activeCountries = selected.length > 0 ? selected : defaultTop5

  if (l1 || l2)
    return (
      <div className="p-12 text-center text-slate-400">Loading…</div>
    )

  return (
    <div className="space-y-6">
      <ChartCard
        title={`Top ${topN} producing countries — ${winStart}–${winEnd} average (million tonnes/yr)`}
        controls={
          <>
            <Dropdown label="Window" options={WINDOW_OPTIONS} value={window} onChange={setWindow} />
            <Dropdown label="Show" options={TOP_N_OPTIONS} value={topN} onChange={setTopN} />
          </>
        }
      >
        <BarChart
          data={barData}
          labelKey="country"
          valueKey="avg_tonnes_mt"
          xLabel="Million tonnes / year"
        />
      </ChartCard>

      <TimeFilteredChartCard
        title="Production trajectory of selected countries (million tonnes / year)"
        extraControls={
          <MultiSelect
            label="Countries"
            options={allCountries}
            value={activeCountries}
            onChange={setSelected}
          />
        }
      >
        {([yMin, yMax]) => (
          <LineChart
            data={tsData.filter(
              d =>
                activeCountries.includes(d.country) &&
                d.year >= yMin &&
                d.year <= yMax,
            )}
            yKey="value_mt"
            groupKey="country"
            yLabel="Million tonnes / year"
          />
        )}
      </TimeFilteredChartCard>
    </div>
  )
}
