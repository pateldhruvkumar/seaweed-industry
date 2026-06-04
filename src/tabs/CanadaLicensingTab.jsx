import { useMemo } from 'react'
import { useData } from '../hooks/useData'
import KpiCard from '../components/KpiCard'
import ChartCard from '../components/ChartCard'
import ChartWithInsights from '../components/ChartWithInsights'
import SourceNote from '../components/SourceNote'
import BarChart from '../components/charts/BarChart'
import LineChart from '../components/charts/LineChart'
import DataTable from '../components/DataTable'
import { SectionHeader } from '../components/psia'
import { SOURCES, CANADA_LICENSING_INTRO } from '../data/canada'

const C0 = '#0d9488' // BarChart/LineChart default — keeps the legend swatch in sync
const num = v => (v == null ? '—' : Number(v).toLocaleString())
const last = arr => (arr?.length ? arr[arr.length - 1] : null)

/**
 * Canada · Aquaculture Licensing & Sites.
 *
 * Cultivation & Harvesting KPIs: Number of Licenses & Sites, Licensed Sites
 * (count), Total Permitted Area, Average Farm Size, and Operating Expense to
 * Revenue Ratio. Only Nova Scotia separates seaweed (marine-plant + wild
 * rockweed leases); BC counts are all-aquaculture. Every visual cites its source.
 */
export default function CanadaLicensingTab() {
  const { data: sites, loading: l1 } = useData('canada_aqua_sites.json')
  const { data: area, loading: l2 } = useData('canada_permitted_area.json')
  const { data: opex, loading: l3 } = useData('canada_opex_ratio.json')

  const areaRows = useMemo(() => {
    if (!area) return []
    return [
      { label: 'NS: all aquaculture', ...area.ns_all_aquaculture },
      { label: 'NS: leases incl. marine plants', ...area.ns_marine_plant },
      { label: 'NS: wild rockweed (harvest zones)', ...area.ns_rockweed_wild },
    ]
  }, [area])

  const nsCountRows = useMemo(() => {
    if (!sites) return []
    return [
      { label: 'All aquaculture leases', count: sites.ns_leases_total },
      { label: 'Incl. marine plants (seaweed)', count: sites.ns_marine_plant_leases },
      { label: 'Wild rockweed leases', count: sites.ns_rockweed_leases },
    ]
  }, [sites])

  if (l1 || l2 || l3)
    return <div className="p-12 text-center text-slate-400">Loading…</div>

  const opexLatest = last(opex)

  const areaColumns = [
    { key: 'label', label: 'Category' },
    { key: 'leases', label: 'Leases', format: v => num(v) },
    { key: 'hectares', label: 'Permitted area (ha)', format: v => num(v) },
    { key: 'avg_ha', label: 'Avg size (ha)', format: v => num(v) },
  ]

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-brand-900 text-white p-8 lg:p-10">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-400 via-brand-500 to-cyan-400" />
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
            Canada · Cultivation &amp; Harvesting
          </p>
          <h2 className="mt-3 text-3xl lg:text-4xl font-bold tracking-tight">
            {CANADA_LICENSING_INTRO.title}
          </h2>
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            {CANADA_LICENSING_INTRO.description}
          </p>
          <p className="mt-6 text-[11px] text-slate-400 italic">
            {CANADA_LICENSING_INTRO.sourcesLine}
          </p>
        </div>
      </div>

      {/* ── Methodology banner ─────────────────────────────────────── */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
          How to read these numbers
        </p>
        <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">
          In <strong>British Columbia</strong>, DFO licenses finfish, shellfish and
          land-based operations only: <strong>seaweed is authorized provincially and
          not published</strong>, so BC counts are all-aquaculture. <strong>Nova Scotia</strong>
          is the one province that flags seaweed: lease records mark “marine plant”
          species, and a dedicated <strong>wild rockweed</strong> lease set is published.
          Site and area figures are <strong>current-valid snapshots</strong>, not time series.
        </p>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────── */}
      {sites && area && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            variant="teal"
            label="BC licensed sites"
            value={num(sites.bc_total)}
            subtext="DFO · all aquaculture (no seaweed)"
          />
          <KpiCard
            variant="cyan"
            label="NS aquaculture leases"
            value={num(sites.ns_leases_total)}
            subtext={`${sites.ns_marine_plant_leases} include marine plants`}
          />
          <KpiCard
            variant="indigo"
            label="NS permitted area"
            value={`${num(area.ns_all_aquaculture.hectares)} ha`}
            subtext={`${area.ns_all_aquaculture.avg_ha} ha avg farm size`}
          />
          <KpiCard
            variant="emerald"
            label="Operating expense ratio"
            value={opexLatest ? `${opexLatest.opex_ratio_pct}%` : '—'}
            subtext={`${opexLatest?.year ?? ''} · CAD · StatCan (all aquaculture)`}
          />
        </div>
      )}

      {/* ════════ Licences & sites ════════ */}
      <SectionHeader
        kicker="All aquaculture · with caveat"
        title="Licensed sites & leases"
        subtitle="Site/licence counts: BC by sector (DFO) and Nova Scotia leases, with the seaweed subset called out."
      />

      <ChartWithInsights
        tag="KPI · Number of Licenses & Sites"
        title="British Columbia licensed aquaculture sites by sector (DFO)"
        legend={[{ color: C0, label: 'Licensed sites', desc: 'count of current-valid DFO aquaculture licences in BC, by sector' }]}
        notes={[
          'DFO is the licensing authority for aquaculture in BC.',
          'There is no marine-plant/seaweed sector: BC seaweed is provincially authorized and unpublished.',
          'Current-valid snapshot, so no year-over-year trend is available.',
        ]}
        takeaway="BC site counts are all-aquaculture; treat as sector scale, not a seaweed figure."
      >
        <BarChart
          data={sites?.bc_sectors ?? []}
          labelKey="sector"
          valueKey="count"
          xLabel="Licensed sites"
          color={C0}
        />
        <SourceNote {...SOURCES.bcLicences} />
      </ChartWithInsights>

      <ChartWithInsights
        tag="KPI · Licensed Aquaculture Sites (count)"
        title="Nova Scotia aquaculture leases: seaweed subset"
        legend={[{ color: C0, label: 'Leases', desc: 'count of issued NS marine aquaculture / rockweed leases' }]}
        notes={[
          `Of ${num(sites.ns_leases_total)} marine aquaculture leases, ${num(sites.ns_marine_plant_leases)} include marine plants (seaweed co-cultured with shellfish/finfish).`,
          `A separate set of ${num(sites.ns_rockweed_leases)} wild rockweed harvest leases is published distinctly.`,
          'Nova Scotia is the only province where seaweed is separable from the lease data.',
        ]}
        takeaway="NS is the cleanest Canadian source for seaweed-linked sites — but seaweed leases are mostly multi-species, not seaweed-only."
      >
        <BarChart
          data={nsCountRows}
          labelKey="label"
          valueKey="count"
          xLabel="Leases"
          color={C0}
        />
        <SourceNote {...SOURCES.nsLeases} />
      </ChartWithInsights>

      {/* ════════ Permitted area & farm size ════════ */}
      <SectionHeader
        kicker="Nova Scotia only"
        title="Permitted area & average farm size"
        subtitle="Derived from NS lease polygons: BC publishes no area, so this is Nova Scotia only."
      />

      <ChartCard
        title="Permitted area and average farm size (Nova Scotia)"
        subtitle="Total Permitted Area and Average Farm Size KPIs, by category."
      >
        <DataTable columns={areaColumns} data={areaRows} />
        <p className="mt-3 text-xs text-slate-500 leading-relaxed">
          Note: wild rockweed “leases” are large coastal <em>harvest zones</em>
          (≈{num(area.ns_rockweed_wild.avg_ha)} ha average), not cultivation farms:
          hence the very different scale from the marine-aquaculture leases.
        </p>
        <SourceNote {...SOURCES.nsLeases} />
        <SourceNote {...SOURCES.nsRockweed} />
      </ChartCard>

      {/* ════════ Operating expense ratio ════════ */}
      <SectionHeader
        kicker="All aquaculture · StatCan"
        title="Operating expense to revenue ratio"
        subtitle="National aquaculture cost structure over time."
      />

      <ChartWithInsights
        tag="KPI · Operating Expense to Revenue Ratio"
        title="Operating expense to revenue ratio: Canadian aquaculture (%)"
        legend={[{ color: C0, label: 'OpEx ratio', desc: '(intermediate inputs + labour) ÷ total operating revenue, all aquaculture' }]}
        notes={[
          'Computed from StatCan Table 32-10-0108: ((Gross output − Gross value added) + Salaries & wages) ÷ Total operating revenue.',
          'A high ratio (often >90%) reflects the thin operating margins typical of the sector.',
          'All-aquaculture (finfish + shellfish): not seaweed-specific.',
        ]}
        takeaway="The one time-series KPI in this section; seaweed is not separable, so read as sector-wide cost structure."
      >
        <LineChart
          data={opex ?? []}
          yKey="opex_ratio_pct"
          yLabel="% of operating revenue"
          height={340}
        />
        <SourceNote {...SOURCES.valueAdded} />
      </ChartWithInsights>
    </div>
  )
}
