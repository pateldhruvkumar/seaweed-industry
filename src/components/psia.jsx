import Plot from '../lib/Plot'

/**
 * Shared building blocks used by both PSIA briefing tabs.
 *
 * The KPI 1 (Pricing) and KPI 2 (Demand) tabs both need the same hero
 * treatment, section headers, color-swatch legends, and a couple of
 * specialized one-off Plotly charts that don't fit our generic chart
 * components. Centralizing them here keeps each tab file lean and
 * guarantees the two briefings stay visually consistent.
 */

/* ──────────────────────────────────────────────────────────────────────
 *  Hero — gradient cover panel sitting above each briefing's body
 * ────────────────────────────────────────────────────────────────────── */

/**
 * Props:
 *   kpi          – short kicker shown above the title (e.g. "KPI 1")
 *   title        – the briefing's headline (string, may include accent span)
 *   accent       – optional second word that gets the brand color treatment
 *   description  – paragraph rendered under the title
 *   stats        – array of { value, label } shown as "quick stat" cards
 */
export function BriefingHero({ kpi, title, accent, description, stats = [] }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-brand-900 text-white p-8 lg:p-10">
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-400 via-brand-500 to-cyan-400" />

      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-300">
          Pacific Seaweed Industry Association · {kpi}
        </p>
        <h2 className="mt-3 text-3xl lg:text-4xl font-bold tracking-tight">
          {title}
          {accent && <span className="text-brand-300"> {accent}</span>}
        </h2>
        {description && (
          <p className="mt-4 text-sm text-slate-300 leading-relaxed">
            {description}
          </p>
        )}

        {stats.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.map((s, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/5 ring-1 ring-white/10 backdrop-blur-sm p-4"
              >
                <p className="text-xl lg:text-2xl font-bold text-white tabular-nums">
                  {s.value}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 text-[11px] text-slate-400 italic">
          Sources: FAO FishStat · World Bank PROBLUE 2023 · Grand View Research
          2026 · GreenWave 2026 · BC Ministry of Agriculture
        </p>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────
 *  Section header — divider with a kicker + title above each chart group
 * ────────────────────────────────────────────────────────────────────── */

export function SectionHeader({ kicker, title, subtitle }) {
  return (
    <div className="flex items-end gap-4 pb-2 border-b border-slate-200">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
          {kicker}
        </p>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────
 *  Color-swatch legends (used under categorical bar charts)
 * ────────────────────────────────────────────────────────────────────── */

export function TierLegend({ colors }) {
  return <SwatchRow entries={colors} />
}

export function PriorityLegend({ colors }) {
  return <SwatchRow entries={colors} suffix=" priority" />
}

function SwatchRow({ entries, suffix = '' }) {
  return (
    <div className="flex flex-wrap gap-4 mt-3 px-2 text-xs text-slate-600">
      {Object.entries(entries).map(([label, color]) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color }}
          />
          <span>
            {label}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────
 *  Specialized one-off charts
 * ────────────────────────────────────────────────────────────────────── */

/** Two-bar grouped column chart for low/high price ranges. */
export function GroupedRangeBars({ data }) {
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

/** Line chart with a solid actual segment + dashed projected segment. */
export function ProjectedLineChart({ actual, projected }) {
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

/**
 * Donut + 3 corroborating-source callouts side-by-side. Imports DonutChart
 * directly so the data shape stays an internal contract of this component.
 */
import DonutChart from './charts/DonutChart'

export function FormSplitPanel({ donut, callouts }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
      <DonutChart data={donut} colors={['#0d9488', '#cbd5e1']} height={300} />

      <div className="space-y-4">
        {callouts.map((c, i) => (
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
