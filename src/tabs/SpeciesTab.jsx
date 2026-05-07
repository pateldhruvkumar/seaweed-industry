import { useMemo, useState } from 'react'
import { useYear } from '../context/YearContext'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import BarChart from '../components/charts/BarChart'
import Heatmap from '../components/charts/Heatmap'
import AreaChart from '../components/charts/AreaChart'
import Dropdown from '../components/controls/Dropdown'

const WINDOW_OPTIONS = [
  { label: '2020–2024', value: '2020-2024' },
  { label: '2015–2019', value: '2015-2019' },
  { label: '2010–2014', value: '2010-2014' },
  { label: '2000–2004', value: '2000-2004' },
  { label: '1990–1994', value: '1990-1994' },
]

const TOPN_OPTIONS = [
  { label: 'Top 5',  value: '5' },
  { label: 'Top 10', value: '10' },
  { label: 'Top 15', value: '15' },
]

export default function SpeciesTab() {
  const { yearRange: [yMin, yMax] } = useYear()
  const [speciesWindow, setSpeciesWindow] = useState('2020-2024')
  const [heatmapN, setHeatmapN]           = useState('10')

  const { data: speciesData, loading: l1 } = useData('species_totals.json')
  const { data: matrixData,  loading: l2 } = useData('country_species_matrix.json')
  const { data: envQtyData,  loading: l3 } = useData('env_quantity.json')
  const { data: envShareData,loading: l4 } = useData('env_share.json')

  const [wStart, wEnd] = speciesWindow.split('-').map(Number)

  const speciesBar = useMemo(() => {
    if (!speciesData) return []
    return speciesData
      .filter(d => d.year_start === wStart && d.year_end === wEnd)
      .sort((a, b) => b.avg_tonnes_mt - a.avg_tonnes_mt)
      .slice(0, 15)
  }, [speciesData, wStart, wEnd])

  const heatmap = useMemo(() => {
    if (!matrixData) return null
    const n = +heatmapN
    return {
      countries: matrixData.countries.slice(0, n),
      species:   matrixData.species.slice(0, n),
      values:    matrixData.values.slice(0, n).map(row => row.slice(0, n)),
    }
  }, [matrixData, heatmapN])

  const envQty   = useMemo(() => envQtyData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [envQtyData, yMin, yMax])
  const envShare = useMemo(() => envShareData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [envShareData, yMin, yMax])

  if (l1 || l2 || l3 || l4) return <div className="p-12 text-center text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      <ChartCard
        title="Top 15 species / groups by output (million tonnes / year)"
        controls={
          <Dropdown label="Period" options={WINDOW_OPTIONS} value={speciesWindow} onChange={setSpeciesWindow} />
        }
      >
        <BarChart
          data={speciesBar}
          labelKey="species"
          valueKey="avg_tonnes_mt"
          xLabel="Million tonnes / year"
          xDtick={0.5}
        />
      </ChartCard>

      <ChartCard
        title="Country × species specialization — thousand tonnes / year"
        controls={
          <Dropdown label="Show top" options={TOPN_OPTIONS} value={heatmapN} onChange={setHeatmapN} />
        }
      >
        <Heatmap data={heatmap} />
      </ChartCard>

      <ChartCard title="Aquaculture quantity by environment (million tonnes / year)">
        <AreaChart
          data={envQty}
          groupKey="environment"
          valueKey="value_mt"
          yLabel="Million tonnes"
          yDtick={5}
        />
      </ChartCard>

      <ChartCard title="Aquaculture environment share (%)">
        <AreaChart data={envShare} groupKey="environment" valueKey="share_pct" yLabel="% of aquaculture quantity" />
      </ChartCard>
    </div>
  )
}
