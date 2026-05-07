import { useMemo, useState } from 'react'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import TimeFilteredChartCard from '../components/TimeFilteredChartCard'
import KpiCard from '../components/KpiCard'
import LineChart from '../components/charts/LineChart'
import DataTable from '../components/DataTable'
import Dropdown from '../components/controls/Dropdown'
import { BriefingHero } from '../components/psia'

/**
 * KPI · Value of Seaweed ($/lb)
 *
 * FAO publishes prices in $/tonne. This tab presents the same volume-weighted
 * price data converted to $/lb (the more common unit in North-American
 * retail / wholesale conversations) with a unit toggle so the user can
 * switch back to $/tonne or $/kg if preferred.
 *
 * Conversions (1 metric tonne = 1000 kg = 2204.6226 lb):
 *   $/tonne → $/lb : divide by 2204.6226
 *   $/tonne → $/kg : divide by 1000
 */
const TONNE_TO_LB = 2204.6226

const UNIT_OPTIONS = [
  { value: 'lb', label: '$/lb' },
  { value: 'kg', label: '$/kg' },
  { value: 'tonne', label: '$/tonne' },
]

const UNIT_DIVISOR = {
  lb: TONNE_TO_LB,
  kg: 1000,
  tonne: 1,
}

const UNIT_LABEL = {
  lb: 'USD per pound',
  kg: 'USD per kilogram',
  tonne: 'USD per tonne',
}

const UNIT_FORMAT = {
  lb: v => `$${Number(v).toFixed(2)}`,
  kg: v => `$${Number(v).toFixed(2)}`,
  tonne: v => `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
}

export default function KpiValuePerLbTab() {
  const [unit, setUnit] = useState('lb')

  const { data: priceGlobal, loading: l1 } = useData('price_global.json')
  const { data: priceEnv, loading: l2 } = useData('price_by_env.json')
  const { data: speciesPrice, loading: l3 } = useData('species_price_table.json')

  const divisor = UNIT_DIVISOR[unit]
  const fmt = UNIT_FORMAT[unit]

  // Latest-year species table
  const speciesTable = useMemo(() => {
    if (!speciesPrice) return { rows: [], year: null }
    const latestYear = Math.max(...speciesPrice.map(d => d.year))
    const rows = speciesPrice
      .filter(d => d.year === latestYear && d.usd_per_tonne != null)
      .map(d => ({
        species: d.species,
        tonnes: d.tonnes,
        price_unit: d.usd_per_tonne / divisor,
        price_tonne: d.usd_per_tonne,
      }))
      .sort((a, b) => b.price_unit - a.price_unit)
    return { rows, year: latestYear }
  }, [speciesPrice, divisor])

  // KPI numerics
  const stats = useMemo(() => {
    if (!priceGlobal || !priceGlobal.length) return null
    const sorted = [...priceGlobal].sort((a, b) => a.year - b.year)
    const latest = sorted[sorted.length - 1]
    const earliest = sorted[0]
    const cagr =
      sorted.length > 1 && earliest.usd_per_tonne > 0
        ? (Math.pow(
            latest.usd_per_tonne / earliest.usd_per_tonne,
            1 / (latest.year - earliest.year),
          ) -
            1) *
          100
        : null
    return {
      latest,
      earliest,
      cagr,
      latestUnit: latest.usd_per_tonne / divisor,
    }
  }, [priceGlobal, divisor])

  if (l1 || l2 || l3)
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-slate-200/50 h-48 animate-pulse" />
      </div>
    )

  const tableColumns = [
    { key: 'species', label: 'Species' },
    {
      key: 'tonnes',
      label: 'Volume (tonnes / yr)',
      format: v => Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 }),
    },
    {
      key: 'price_unit',
      label: UNIT_OPTIONS.find(o => o.value === unit).label,
      format: v => fmt(v),
    },
    {
      key: 'price_tonne',
      label: '$/tonne',
      format: v => `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
  ]

  return (
    <div className="space-y-8">
      <BriefingHero
        kpi="Market & End-Use"
        title="Value of"
        accent="Seaweed ($/lb)"
        description="Volume-weighted average aquaculture price, derived from FAO FishStat aquaculture quantity & value tables. Toggle the unit between pounds, kilograms, and tonnes — the underlying $/tonne data is the same."
        stats={[
          {
            value: stats ? fmt(stats.latestUnit) : '—',
            label: `Global avg · ${stats?.latest?.year ?? '—'}`,
          },
          {
            value: stats?.cagr != null ? `${stats.cagr.toFixed(2)}%` : '—',
            label: `CAGR · ${stats?.earliest?.year ?? '—'}–${stats?.latest?.year ?? '—'}`,
          },
          {
            value: speciesTable.rows.length
              ? fmt(speciesTable.rows[0].price_unit)
              : '—',
            label: `Highest-priced species · ${speciesTable.year ?? '—'}`,
          },
        ]}
      />

      {/* Headline KPI strip */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            variant="teal"
            label="Latest global avg"
            value={fmt(stats.latestUnit)}
            subtext={`Year ${stats.latest.year}`}
          />
          <KpiCard
            variant="cyan"
            label="Long-run CAGR"
            value={stats.cagr != null ? `${stats.cagr.toFixed(2)}%` : '—'}
            subtext={`${stats.earliest.year}–${stats.latest.year}`}
          />
          <KpiCard
            variant="indigo"
            label={`Top species · ${speciesTable.year}`}
            value={speciesTable.rows[0]?.species ?? '—'}
            subtext={
              speciesTable.rows[0]
                ? `${fmt(speciesTable.rows[0].price_unit)} · ${UNIT_OPTIONS.find(o => o.value === unit).label}`
                : ''
            }
          />
        </div>
      )}

      {/* Global price (year slider + unit toggle) */}
      <TimeFilteredChartCard
        title="Volume-weighted average aquaculture price — global"
        subtitle="Sum of value ÷ sum of quantity across all reporting countries each year. Toggle the price unit on the right."
        extraControls={
          <Dropdown
            label="Unit"
            options={UNIT_OPTIONS}
            value={unit}
            onChange={setUnit}
          />
        }
      >
        {([yMin, yMax]) => {
          const data = priceGlobal
            .filter(d => d.year >= yMin && d.year <= yMax)
            .map(d => ({ ...d, price: d.usd_per_tonne / divisor }))
          return (
            <LineChart
              data={data}
              xKey="year"
              yKey="price"
              yLabel={UNIT_LABEL[unit]}
              height={360}
            />
          )
        }}
      </TimeFilteredChartCard>

      {/* By environment (year slider, inherits unit) */}
      <TimeFilteredChartCard
        title="Average price by farming environment (log scale)"
        subtitle="Marine vs Brackish water vs Inland/freshwater. Same volume-weighting, broken out by FAO environment code."
      >
        {([yMin, yMax]) => {
          const data = priceEnv
            .filter(d => d.year >= yMin && d.year <= yMax)
            .map(d => ({ ...d, price: d.usd_per_tonne / divisor }))
          return (
            <LineChart
              data={data}
              xKey="year"
              yKey="price"
              groupKey="environment"
              yLabel={`${UNIT_LABEL[unit]} (log)`}
              yLog
              height={380}
            />
          )
        }}
      </TimeFilteredChartCard>

      {/* Latest-year species table */}
      <ChartCard
        title={`Highest-priced species · ${speciesTable.year}`}
        subtitle="Sorted by implied unit price. Volume column is annual aquaculture tonnage of that species globally."
      >
        <DataTable columns={tableColumns} data={speciesTable.rows} />
      </ChartCard>
    </div>
  )
}
