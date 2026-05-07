import Plot from '../lib/Plot'
import ChartWithInsights from '../components/ChartWithInsights'
import AreaChart from '../components/charts/AreaChart'
import BarChart from '../components/charts/BarChart'
import LineChart from '../components/charts/LineChart'
import DonutChart from '../components/charts/DonutChart'
import RadarChart from '../components/charts/RadarChart'
import {
  GLOBAL_AQUA_TREND,
  SPECIES_PRICES_2022,
  SPECIES_PRICE_TREND,
  TOP_COUNTRIES_VALUE,
  BC_PRICE_BENCHMARKS,
  FORM_SPLIT,
  END_USE_SPLIT,
  HYDROCOLLOID_MARKET,
  BC_VS_GLOBAL_RADAR,
  NA_EMERGING_APPS,
} from '../data/psia'

/**
 * PSIA Briefing tab — a translation of the PDF "BC Seaweed Industry KPI
 * Data Briefing" into interactive panels.
 *
 * Each chart panel uses ChartWithInsights, which renders the chart on
 * the left and the briefing's "Key Notes" + "Why it matters" on the right
 * — exactly mirroring the PDF layout.
 *
 * Two top-level KPI groups, separated by a section header:
 *   KPI 1 — Price per Wet Tonne by Species & End Use ($/tonne)
 *   KPI 2 — Wet vs. Processed Kelp Demand
 */
export default function PsiaBriefingTab() {
  return (
    <div className="space-y-10">
      {/* Hero strip mirroring the PDF cover page */}
      <BriefingHero />

      {/* ── KPI 1 ───────────────────────────────────────────────── */}
      <SectionHeader
        kicker="KPI 1"
        title="Price per Wet Tonne by Species & End Use"
        subtitle="Global benchmarks, 2010 – 2022, and how BC fits in."
      />

      <div className="space-y-6">
        {/* 1.1 Global aquaculture production trend */}
        <ChartWithInsights
          tag={GLOBAL_AQUA_TREND.tag}
          title={GLOBAL_AQUA_TREND.title}
          notes={GLOBAL_AQUA_TREND.notes}
          takeaway={GLOBAL_AQUA_TREND.takeaway}
        >
          <AreaChart
            data={GLOBAL_AQUA_TREND.data.map(d => ({
              year: d.year,
              source: 'Production',
              value_mt: d.value_mt,
            }))}
            groupKey="source"
            valueKey="value_mt"
            yLabel="Million wet tonnes"
            height={380}
          />
        </ChartWithInsights>

        {/* 1.2 Price per wet tonne by species (color-coded by tier) */}
        <ChartWithInsights
          tag={SPECIES_PRICES_2022.tag}
          title={SPECIES_PRICES_2022.title}
          notes={SPECIES_PRICES_2022.notes}
          takeaway={SPECIES_PRICES_2022.takeaway}
        >
          <BarChart
            data={SPECIES_PRICES_2022.data.map(d => ({
              ...d,
              color: SPECIES_PRICES_2022.tierColors[d.tier],
            }))}
            labelKey="species"
            valueKey="price"
            colorKey="color"
            xLabel="USD per Wet Tonne"
            sort="asc"
            format={v => `$${Number(v).toLocaleString()}`}
            height={440}
          />
          <TierLegend colors={SPECIES_PRICES_2022.tierColors} />
        </ChartWithInsights>

        {/* 1.3 Price trend by species (multi-line) */}
        <ChartWithInsights
          tag={SPECIES_PRICE_TREND.tag}
          title={SPECIES_PRICE_TREND.title}
          notes={SPECIES_PRICE_TREND.notes}
          takeaway={SPECIES_PRICE_TREND.takeaway}
        >
          <LineChart
            data={SPECIES_PRICE_TREND.data}
            xKey="year"
            yKey="price"
            groupKey="species"
            yLabel="USD per Wet Tonne"
            height={380}
          />
        </ChartWithInsights>

        {/* 1.4 Top countries by aquaculture value (vertical) */}
        <ChartWithInsights
          tag={TOP_COUNTRIES_VALUE.tag}
          title={TOP_COUNTRIES_VALUE.title}
          notes={TOP_COUNTRIES_VALUE.notes}
          takeaway={TOP_COUNTRIES_VALUE.takeaway}
        >
          <BarChart
            data={TOP_COUNTRIES_VALUE.data.map(d => ({
              ...d,
              color: d.highlight ? '#dc2626' : '#0d9488', // red for #1, teal otherwise
            }))}
            labelKey="country"
            valueKey="value_musd"
            colorKey="color"
            orientation="vertical"
            yLabel="USD Millions (avg 2017 – 2022)"
            sort="desc"
            format={v => `$${Number(v).toFixed(1)}M`}
            height={400}
          />
        </ChartWithInsights>

        {/* 1.5 BC & North American Price Benchmarks (grouped vertical) */}
        <ChartWithInsights
          tag={BC_PRICE_BENCHMARKS.tag}
          title={BC_PRICE_BENCHMARKS.title}
          notes={BC_PRICE_BENCHMARKS.notes}
          takeaway={BC_PRICE_BENCHMARKS.takeaway}
        >
          <GroupedRangeBars data={BC_PRICE_BENCHMARKS.data} />
        </ChartWithInsights>
      </div>

      {/* ── KPI 2 ───────────────────────────────────────────────── */}
      <SectionHeader
        kicker="KPI 2"
        title="Wet vs. Processed Kelp Demand"
        subtitle="Where the volume goes, and where the value is heading."
      />

      <div className="space-y-6">
        {/* 2.1 Form split (donut + 3 callouts) */}
        <ChartWithInsights
          tag={FORM_SPLIT.tag}
          title={FORM_SPLIT.title}
          notes={FORM_SPLIT.notes}
          takeaway={FORM_SPLIT.takeaway}
        >
          <FormSplitPanel />
        </ChartWithInsights>

        {/* 2.2 End-use distribution */}
        <ChartWithInsights
          tag={END_USE_SPLIT.tag}
          title={END_USE_SPLIT.title}
          notes={END_USE_SPLIT.notes}
          takeaway={END_USE_SPLIT.takeaway}
        >
          <BarChart
            data={END_USE_SPLIT.data}
            labelKey="category"
            valueKey="share_pct"
            colorKey="color"
            xLabel="Estimated Market Share (%)"
            sort="asc"
            format={v => `${v}%`}
            height={400}
          />
        </ChartWithInsights>

        {/* 2.3 Hydrocolloid market growth (actual + projected) */}
        <ChartWithInsights
          tag={HYDROCOLLOID_MARKET.tag}
          title={HYDROCOLLOID_MARKET.title}
          notes={HYDROCOLLOID_MARKET.notes}
          takeaway={HYDROCOLLOID_MARKET.takeaway}
        >
          <ProjectedLineChart
            actual={HYDROCOLLOID_MARKET.actual}
            projected={HYDROCOLLOID_MARKET.projected}
          />
        </ChartWithInsights>

        {/* 2.4 BC radar */}
        <ChartWithInsights
          tag={BC_VS_GLOBAL_RADAR.tag}
          title={BC_VS_GLOBAL_RADAR.title}
          notes={BC_VS_GLOBAL_RADAR.notes}
          takeaway={BC_VS_GLOBAL_RADAR.takeaway}
        >
          <RadarChart
            axes={BC_VS_GLOBAL_RADAR.axes}
            series={[
              { name: 'BC Seaweed Industry', values: BC_VS_GLOBAL_RADAR.bc, color: '#0d9488' },
              { name: 'Global Average',     values: BC_VS_GLOBAL_RADAR.global, color: '#c2410c' },
            ]}
            max={5}
            height={460}
          />
        </ChartWithInsights>

        {/* 2.5 NA emerging applications */}
        <ChartWithInsights
          tag={NA_EMERGING_APPS.tag}
          title={NA_EMERGING_APPS.title}
          notes={NA_EMERGING_APPS.notes}
          takeaway={NA_EMERGING_APPS.takeaway}
        >
          <BarChart
            data={NA_EMERGING_APPS.data.map(d => ({
              ...d,
              color: NA_EMERGING_APPS.priorityColors[d.priority],
            }))}
            labelKey="application"
            valueKey="value_musd"
            colorKey="color"
            orientation="vertical"
            yLabel="Projected Market Opportunity (USD M) by 2030"
            sort="desc"
            format={v => `$${Number(v).toLocaleString()}M`}
            height={420}
          />
          <PriorityLegend colors={NA_EMERGING_APPS.priorityColors} />
        </ChartWithInsights>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────── */
/*  Sub-components used only inside this tab                            */
/* ──────────────────────────────────────────────────────────────────── */

function BriefingHero() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-brand-900 text-white p-8 lg:p-10">
      {/* Decorative top stripe */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-400 via-brand-500 to-cyan-400" />

      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
          Pacific Seaweed Industry Association
        </p>
        <h2 className="mt-3 text-3xl lg:text-4xl font-bold tracking-tight">
          BC Seaweed Industry{' '}
          <span className="text-brand-300">KPI Data Briefing</span>
        </h2>
        <p className="mt-4 text-sm text-slate-300 leading-relaxed">
          Two strategic KPIs benchmarking BC's emerging seaweed sector against
          global production, prices, and emerging downstream demand.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <KpiHeroCard
            label="KPI 1"
            value="Price per Wet Tonne"
            subtext="By species & end use ($/tonne)"
          />
          <KpiHeroCard
            label="KPI 2"
            value="Wet vs. Processed Demand"
            subtext="Form split, end-use, market opportunity"
          />
        </div>

        <p className="mt-6 text-[11px] text-slate-400 italic">
          Sources: FAO FishStat · World Bank PROBLUE 2023 · Grand View Research
          2026 · GreenWave 2026 · BC Ministry of Agriculture
        </p>
      </div>
    </div>
  )
}

function KpiHeroCard({ label, value, subtext }) {
  return (
    <div className="rounded-xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-300">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-white">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>
    </div>
  )
}

function SectionHeader({ kicker, title, subtitle }) {
  return (
    <div className="flex items-end gap-4 pb-2 border-b border-slate-200">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
          {kicker}
        </p>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

/** Small color-swatch legend for the species-prices chart. */
function TierLegend({ colors }) {
  return (
    <div className="flex flex-wrap gap-4 mt-3 px-2 text-xs text-slate-600">
      {Object.entries(colors).map(([label, color]) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <span>{label}</span>
        </div>
      ))}
    </div>
  )
}

/** Small color-swatch legend for the priority-tiered emerging-apps chart. */
function PriorityLegend({ colors }) {
  return (
    <div className="flex flex-wrap gap-4 mt-3 px-2 text-xs text-slate-600">
      {Object.entries(colors).map(([label, color]) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <span>{label} priority</span>
        </div>
      ))}
    </div>
  )
}

/** Two-bar grouped chart for low/high price ranges. */
function GroupedRangeBars({ data }) {
  return (
    <Plot
      data={[
        {
          type: 'bar',
          name: 'Low estimate',
          x: data.map(d => d.segment),
          y: data.map(d => d.low),
          marker: { color: '#94a3b8' }, // slate-400
          text: data.map(d => `$${d.low.toLocaleString()}`),
          textposition: 'outside',
          cliponaxis: false,
        },
        {
          type: 'bar',
          name: 'High estimate',
          x: data.map(d => d.segment),
          y: data.map(d => d.high),
          marker: { color: '#0d9488' }, // brand-600
          text: data.map(d => `$${d.high.toLocaleString()}`),
          textposition: 'outside',
          cliponaxis: false,
        },
      ]}
      layout={{
        barmode: 'group',
        bargap: 0.3,
        bargroupgap: 0.12,
        xaxis: { tickfont: { size: 11 } },
        yaxis: { title: 'CAD/USD per Wet Tonne (approx.)' },
        legend: { orientation: 'h', y: 1.12 },
        margin: { t: 50, r: 20, b: 80, l: 80 },
      }}
      useResizeHandler
      style={{ width: '100%', height: '420px' }}
      config={{ responsive: true, displaylogo: false }}
    />
  )
}

/** Line chart with a solid actual segment + a dashed projected segment. */
function ProjectedLineChart({ actual, projected }) {
  return (
    <Plot
      data={[
        {
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Actual',
          x: actual.map(d => d.year),
          y: actual.map(d => d.value_busd),
          line: { color: '#0d9488', width: 2.5 },
          marker: { size: 6, color: '#0d9488' },
          fill: 'tozeroy',
          fillcolor: 'rgba(13,148,136,0.08)',
          hovertemplate: '<b>%{x}</b><br>$%{y}B<extra>Actual</extra>',
        },
        {
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Projected (5.0% CAGR)',
          x: projected.map(d => d.year),
          y: projected.map(d => d.value_busd),
          line: { color: '#ea580c', width: 2.5, dash: 'dash' },
          marker: { size: 6, color: '#ea580c' },
          fill: 'tozeroy',
          fillcolor: 'rgba(234,88,12,0.05)',
          hovertemplate: '<b>%{x}</b><br>$%{y}B<extra>Projected</extra>',
        },
      ]}
      layout={{
        xaxis: { title: 'Year' },
        yaxis: {
          title: 'Market Size (USD Billion)',
          tickprefix: '$',
          ticksuffix: 'B',
        },
        legend: { orientation: 'h', y: 1.12 },
        margin: { t: 40, r: 20, b: 50, l: 70 },
        annotations: [
          {
            x: 2025,
            y: 13.6,
            text: '<b>$13.6B (2025)</b>',
            showarrow: true,
            arrowhead: 2,
            ax: -40,
            ay: -30,
            font: { color: '#0d9488', size: 12 },
            bgcolor: 'white',
            bordercolor: '#0d9488',
            borderpad: 4,
          },
        ],
      }}
      useResizeHandler
      style={{ width: '100%', height: '420px' }}
      config={{ responsive: true, displaylogo: false }}
    />
  )
}

/** Donut + 3 stat callouts side-by-side, matching the source slide. */
function FormSplitPanel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
      <DonutChart
        data={FORM_SPLIT.donut}
        colors={['#0d9488', '#cbd5e1']}
        height={300}
      />

      <div className="space-y-4">
        {FORM_SPLIT.callouts.map((c, i) => (
          <div
            key={i}
            className="flex items-baseline gap-4 border-b border-slate-100 last:border-b-0 pb-3 last:pb-0"
          >
            <p className="text-3xl font-bold text-brand-600 tabular-nums w-28 shrink-0">
              {c.value}
            </p>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{c.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{c.source}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
