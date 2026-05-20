import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceDot,
  Area,
  AreaChart as RechartsAreaChart,
  LabelList,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
} from './ui/chart'
import { GRID_COLOR, axisProps } from '../lib/chartTheme'

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
  const config = {
    low: { label: 'Low estimate', color: '#94a3b8' },
    high: { label: 'High estimate', color: '#0d9488' },
  }
  return (
    <ChartContainer config={config} className="aspect-auto" style={{ width: '100%', height: '420px' }}>
      <RechartsBarChart data={data} margin={{ top: 32, right: 24, bottom: 32, left: 24 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="segment" {...axisProps} interval={0} />
        <YAxis
          {...axisProps}
          label={{ value: 'CAD/USD per Wet Tonne (approx.)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
        />
        <ChartTooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltipContent valueFormatter={v => `$${v.toLocaleString()}`} />} />
        <Legend content={<ChartLegendContent />} verticalAlign="top" />
        <Bar dataKey="low" name="Low estimate" fill="#94a3b8" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="low" position="top" formatter={v => `$${v.toLocaleString()}`} style={{ fill: '#475569', fontSize: 10 }} />
        </Bar>
        <Bar dataKey="high" name="High estimate" fill="#0d9488" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="high" position="top" formatter={v => `$${v.toLocaleString()}`} style={{ fill: '#475569', fontSize: 10 }} />
        </Bar>
      </RechartsBarChart>
    </ChartContainer>
  )
}

/** Line chart with a solid actual segment + dashed projected segment. */
export function ProjectedLineChart({ actual, projected }) {
  // Merge into a single timeline so the X axis stays continuous; each row
  // carries either an `actual` or `projected` y value (or both at the join).
  const allYears = [...new Set([...actual.map(d => d.year), ...projected.map(d => d.year)])].sort((a, b) => a - b)
  const actualLookup = Object.fromEntries(actual.map(d => [d.year, d.value_busd]))
  const projLookup = Object.fromEntries(projected.map(d => [d.year, d.value_busd]))
  const rows = allYears.map(y => ({
    year: y,
    actual: actualLookup[y] ?? null,
    projected: projLookup[y] ?? null,
  }))

  const config = {
    actual: { label: 'Actual', color: '#0d9488' },
    projected: { label: 'Projected (5.0% CAGR)', color: '#ea580c' },
  }

  return (
    <ChartContainer config={config} className="aspect-auto" style={{ width: '100%', height: '420px' }}>
      <RechartsAreaChart data={rows} margin={{ top: 24, right: 24, bottom: 16, left: 16 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="year" {...axisProps} label={{ value: 'Year', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }} />
        <YAxis
          {...axisProps}
          tickFormatter={v => `$${v}B`}
          label={{ value: 'Market Size (USD Billion)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
        />
        <ChartTooltip
          cursor={{ stroke: '#e2e8f0' }}
          content={<ChartTooltipContent valueFormatter={v => `$${v}B`} />}
        />
        <Legend content={<ChartLegendContent />} verticalAlign="top" />
        <Area type="monotone" dataKey="actual" stroke="#0d9488" strokeWidth={2.5} fill="#0d9488" fillOpacity={0.08} dot={{ r: 4, fill: '#0d9488' }} isAnimationActive={false} connectNulls />
        <Area type="monotone" dataKey="projected" stroke="#ea580c" strokeWidth={2.5} strokeDasharray="6 4" fill="#ea580c" fillOpacity={0.05} dot={{ r: 4, fill: '#ea580c' }} isAnimationActive={false} connectNulls />
        <ReferenceDot
          x={2025}
          y={13.6}
          r={0}
          label={{
            value: '$13.6B (2025)',
            position: 'top',
            fill: '#0d9488',
            fontSize: 11,
            fontWeight: 600,
          }}
        />
      </RechartsAreaChart>
    </ChartContainer>
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
