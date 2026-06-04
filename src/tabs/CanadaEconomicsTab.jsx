import { useMemo } from 'react'
import { useData } from '../hooks/useData'
import KpiCard from '../components/KpiCard'
import ChartWithInsights from '../components/ChartWithInsights'
import SourceNote from '../components/SourceNote'
import LineChart from '../components/charts/LineChart'
import BarChart from '../components/charts/BarChart'
import { SectionHeader } from '../components/psia'
import { SOURCES, CANADA_INTRO } from '../data/canada'

/** $M → "$1.37B" for billions, "$15.6M" for millions. */
const fmtMusd = v =>
  v == null ? '—' : v >= 1000 ? `$${(v / 1000).toFixed(2)}B` : `$${v.toFixed(1)}M`

const last = arr => (arr?.length ? arr[arr.length - 1] : null)

// Swatch colours mirror PLOT_COLORS / BarChart defaults so the side-panel legend
// matches the on-chart series colours exactly (see lib/chartTheme.js).
const C = ['#0d9488', '#0891b2', '#3b82f6']

const LEGENDS = {
  exports: [
    { color: C[0], label: 'Total seaweed exports', desc: 'all Canadian seaweed/algae exports (sum of the two HS codes)' },
    { color: C[1], label: 'Food-grade (HS 1212.21)', desc: 'seaweed fit for human consumption' },
    { color: C[2], label: 'Other / industrial (HS 1212.29)', desc: 'other algae: carrageenan & rockweed feedstock' },
  ],
  aquaValue: [
    { color: C[0], label: 'Value of sales', desc: 'farm-gate value of all Canadian aquaculture, $M CAD per year' },
  ],
  province: [
    { color: C[0], label: 'Value of sales', desc: 'each bar is one province’s aquaculture value of sales in the latest year' },
  ],
  valueAdded: [
    { color: C[0], label: 'Gross output', desc: 'total value of goods & services the sector produces' },
    { color: C[1], label: 'Gross value added (factor cost)', desc: 'output minus bought-in inputs: the Processing Value-Added KPI' },
    { color: C[2], label: 'Salaries and wages', desc: 'labour income paid: the jobs / labour indicator' },
  ],
  trade: [
    { color: C[0], label: 'Interprovincial exports', desc: 'fishery products shipped to other provinces' },
    { color: C[1], label: 'International exports', desc: 'fishery products exported outside Canada' },
  ],
}

/**
 * Canada · Economics tab.
 *
 * Covers 9 Economic KPIs from the Canadian angle. Only Export Value is
 * seaweed-specific (UN Comtrade HS 1212.21/.29); the production, value-added
 * and interprovincial-trade series are StatCan all-aquaculture aggregates and
 * carry an explicit caveat. Every visual cites its source via <SourceNote/>.
 */
export default function CanadaEconomicsTab() {
  const { data: exports, loading: l1 } = useData('canada_seaweed_exports.json')
  const { data: aquaVal, loading: l2 } = useData('canada_aqua_value_yearly.json')
  const { data: byProv, loading: l3 } = useData('canada_aqua_value_by_province.json')
  const { data: valAdd, loading: l4 } = useData('canada_valueadded.json')
  const { data: trade, loading: l5 } = useData('canada_interprov_trade.json')

  const kpis = useMemo(() => {
    if (!exports || !aquaVal || !valAdd) return null
    const expLatest = last(exports)
    const expPrev = exports[exports.length - 2]
    const expYoy =
      expLatest && expPrev && expPrev.total_musd > 0
        ? ((expLatest.total_musd - expPrev.total_musd) / expPrev.total_musd) * 100
        : null
    const valLatest = last(aquaVal.filter(d => d.value_musd != null))

    const byYearComp = c =>
      valAdd.filter(d => d.component === c && d.value_musd != null)
    const gva = last(byYearComp('Gross value added (factor cost)'))
    const wages = last(byYearComp('Salaries and wages'))

    return { expLatest, expYoy, valLatest, gva, wages }
  }, [exports, aquaVal, valAdd])

  // Long-format export series (total + the two HS sub-codes) for a multi-line chart.
  const exportSeries = useMemo(() => {
    if (!exports) return []
    return exports.flatMap(d => [
      { year: d.year, series: 'Total seaweed exports', value: d.total_musd },
      { year: d.year, series: 'Food-grade (HS 1212.21)', value: d.food_musd },
      { year: d.year, series: 'Other / industrial (HS 1212.29)', value: d.other_musd },
    ])
  }, [exports])

  // Value-added components we surface (drop the long expense line items).
  // Sort by the fixed component order so the chart's series colours line up
  // with the side-panel legend swatches.
  const valAddSeries = useMemo(() => {
    if (!valAdd) return []
    const keep = ['Gross output', 'Gross value added (factor cost)', 'Salaries and wages']
    return valAdd
      .filter(d => keep.includes(d.component) && d.value_musd != null)
      .sort((a, b) => keep.indexOf(a.component) - keep.indexOf(b.component) || a.year - b.year)
  }, [valAdd])

  // Interprovincial vs international flows, ordered to match the legend.
  const tradeSeries = useMemo(() => {
    if (!trade) return []
    const order = ['Interprovincial exports', 'International exports']
    return trade
      .filter(d => d.value_musd != null)
      .sort((a, b) => order.indexOf(a.flow) - order.indexOf(b.flow) || a.year - b.year)
  }, [trade])

  if (l1 || l2 || l3 || l4 || l5)
    return <div className="p-12 text-center text-slate-400">Loading…</div>

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-brand-900 text-white p-8 lg:p-10">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-400 via-brand-500 to-cyan-400" />
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
            Canada · Economic KPIs
          </p>
          <h2 className="mt-3 text-3xl lg:text-4xl font-bold tracking-tight">
            {CANADA_INTRO.title}
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            {CANADA_INTRO.description}
          </p>
          <p className="mt-6 text-[11px] text-slate-400 italic">
            {CANADA_INTRO.sourcesLine}
          </p>
        </div>
      </div>

      {/* ── Methodology banner ─────────────────────────────────────── */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
          How to read these numbers
        </p>
        <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">
          Canada does not report seaweed separately in its official aquaculture
          statistics: StatCan and DFO track aquaculture as <em>finfish + shellfish</em>.
          Only <strong>export value</strong> below is seaweed-specific (HS 1212 trade
          codes). The production, value-added and trade-flow series are
          <strong> all-aquaculture aggregates</strong>, labelled as such on each chart.
        </p>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────── */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            variant="teal"
            label="Seaweed exports"
            value={fmtMusd(kpis.expLatest?.total_musd)}
            subtext={`${kpis.expLatest?.year} · USD · Comtrade HS 1212`}
            trend={
              kpis.expYoy != null
                ? {
                    dir: kpis.expYoy >= 0 ? 'up' : 'down',
                    text: `${kpis.expYoy >= 0 ? '+' : ''}${kpis.expYoy.toFixed(1)}% YoY`,
                  }
                : undefined
            }
          />
          <KpiCard
            variant="cyan"
            label="Aquaculture value of sales"
            value={fmtMusd(kpis.valLatest?.value_musd)}
            subtext={`${kpis.valLatest?.year} · CAD · StatCan (all aquaculture)`}
          />
          <KpiCard
            variant="indigo"
            label="Gross value added"
            value={fmtMusd(kpis.gva?.value_musd)}
            subtext={`${kpis.gva?.year} · CAD · StatCan (all aquaculture)`}
          />
          <KpiCard
            variant="emerald"
            label="Labour income (wages)"
            value={fmtMusd(kpis.wages?.value_musd)}
            subtext={`${kpis.wages?.year} · CAD · StatCan (all aquaculture)`}
          />
        </div>
      )}

      {/* ════════ Seaweed-specific ════════ */}
      <SectionHeader
        kicker="Seaweed-specific"
        title="Export value of Canadian seaweed"
        subtitle="The one series reported for seaweed specifically: HS 1212.21 (food) + 1212.29 (other)."
      />

      <ChartWithInsights
        tag="KPI · Export Value + Revenue Growth"
        title="Canada seaweed export value over time ($M USD)"
        legend={LEGENDS.exports}
        notes={[
          'Seaweed-specific: UN Comtrade HS 1212.21 (fit for human consumption) + 1212.29 (other/industrial).',
          'Export value rose from ~$13M (2013) to ~$19M (2020–21), then eased to ~$16M (2023).',
          'The "Other / industrial" code (carrageenan/rockweed feedstock) is the larger share most years.',
        ]}
        takeaway="This is the only Economic KPI with true seaweed-specific Canadian data. Year-over-year change here is the defensible Revenue Growth figure for Canadian seaweed."
      >
        <LineChart
          data={exportSeries}
          yKey="value"
          groupKey="series"
          yLabel="Million USD / year"
          height={360}
        />
        <SourceNote {...SOURCES.exports} />
      </ChartWithInsights>

      {/* ════════ All-aquaculture aggregates ════════ */}
      <SectionHeader
        kicker="All aquaculture · with caveat"
        title="Production value, value added & jobs"
        subtitle="Best available Canadian figures: finfish + shellfish combined, not seaweed-only."
      />

      <ChartWithInsights
        tag="KPI · Value of Sales / Revenues / Farm-Gate Value"
        title="Canadian aquaculture value of sales ($M, farm-gate)"
        legend={LEGENDS.aquaValue}
        notes={[
          'StatCan reports value at the farm gate, so this covers Value of Sales, Revenues Generated and Farm-Gate Value.',
          'Latest year ≈ $1.37B across all aquaculture; seaweed is a tiny, unreported slice of this.',
        ]}
        takeaway="No seaweed breakout exists. Treat as sector context, not a seaweed revenue figure."
      >
        <LineChart
          data={aquaVal.filter(d => d.value_musd != null)}
          yKey="value_musd"
          yLabel="Million CAD / year"
          height={340}
        />
        <SourceNote {...SOURCES.aquaValue} />
      </ChartWithInsights>

      <ChartWithInsights
        tag="KPI · Value of Sales (by province)"
        title={`Aquaculture value of sales by province: ${byProv?.year} ($M)`}
        legend={LEGENDS.province}
        notes={[
          'Each horizontal bar is one province’s all-aquaculture value of sales in the latest year.',
          'British Columbia leads, followed by the Atlantic provinces (NB, NL, PEI, NS).',
        ]}
        takeaway="Geographic context for where Canadian aquaculture value sits: seaweed is not separable from these provincial totals."
      >
        <BarChart
          data={byProv?.provinces ?? []}
          labelKey="province"
          valueKey="value_musd"
          xLabel="Million CAD / year"
        />
        <SourceNote {...SOURCES.aquaValue} />
      </ChartWithInsights>

      <ChartWithInsights
        tag="KPI · Processing Value Added + Jobs"
        title="Aquaculture value-added account ($M)"
        legend={LEGENDS.valueAdded}
        notes={[
          'Gross value added (factor cost) is the Processing Value Added KPI proxy.',
          'Salaries and wages is the labour-income indicator: StatCan reports labour income, not headcount.',
          'For job counts, DFO publishes aquaculture employment estimates (see source link).',
        ]}
        takeaway="Value added and wages are real StatCan series but cover all aquaculture; no seaweed-only figure is published."
      >
        <LineChart
          data={valAddSeries}
          yKey="value_musd"
          groupKey="component"
          yLabel="Million CAD / year"
          height={360}
        />
        <SourceNote {...SOURCES.valueAdded} />
      </ChartWithInsights>

      <ChartWithInsights
        tag="KPI · Trade Flows Between Provinces"
        title="Fishery-product trade flows: interprovincial vs. international ($M)"
        legend={LEGENDS.trade}
        notes={[
          'StatCan classifies trade by product group, not HS code: the closest group is "Fish, crustaceans, shellfish & other fishery products".',
          'This is broader than aquaculture and not seaweed-specific; use for directional context only.',
        ]}
        takeaway="No seaweed-granular interprovincial trade exists; this fishery-products aggregate is the nearest available proxy."
      >
        <LineChart
          data={tradeSeries}
          yKey="value_musd"
          groupKey="flow"
          yLabel="Million CAD / year"
          height={340}
        />
        <SourceNote {...SOURCES.trade} />
      </ChartWithInsights>
    </div>
  )
}
