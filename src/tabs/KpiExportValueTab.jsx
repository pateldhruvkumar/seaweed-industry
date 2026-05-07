import { useMemo } from 'react'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import TimeFilteredChartCard from '../components/TimeFilteredChartCard'
import KpiCard from '../components/KpiCard'
import LineChart from '../components/charts/LineChart'
import BarChart from '../components/charts/BarChart'
import { BriefingHero } from '../components/psia'

/**
 * KPI · Export Value of Seaweed Products ($/year)
 *
 * IMPORTANT CAVEAT: FAO FishStat does NOT publish trade (export) statistics.
 * It only reports aquaculture *production* volume and value. This tab uses
 * country-level production value as a proxy for export potential — most
 * top-producing countries are also top exporters, so the country ranking
 * is directionally accurate even though the absolute $/year numbers
 * include domestically-consumed product.
 *
 * For a true export figure, the canonical source is UN Comtrade HS code
 * 1212.21 (Seaweeds and other algae, fit for human consumption) — that
 * dataset would replace this proxy if/when it's added to the pipeline.
 */
export default function KpiExportValueTab() {
  const { data: globalYearly,  loading: l1 } = useData('global_aquaculture_value_yearly.json')
  const { data: countryYearly, loading: l2 } = useData('country_value_yearly.json')
  const { data: countryWindow, loading: l3 } = useData('country_value_volume.json')

  // The 5 countries to highlight in the trajectory chart are determined
  // independent of the user's per-chart year-slider — pick from the most
  // recent 5-year window each time.
  const top5Names = useMemo(() => {
    if (!countryWindow) return []
    const latestEnd = Math.max(...countryWindow.map(d => d.year_end))
    return countryWindow
      .filter(d => d.year_end === latestEnd)
      .sort((a, b) => b.avg_value_musd - a.avg_value_musd)
      .slice(0, 5)
      .map(d => d.country)
  }, [countryWindow])

  // Top contributing countries — most recent 5-year window
  const topByValue = useMemo(() => {
    if (!countryWindow) return []
    const latestEnd = Math.max(...countryWindow.map(d => d.year_end))
    return countryWindow
      .filter(d => d.year_end === latestEnd)
      .sort((a, b) => b.avg_value_musd - a.avg_value_musd)
      .slice(0, 12)
  }, [countryWindow])

  // KPI numerics
  const stats = useMemo(() => {
    if (!globalYearly || !globalYearly.length) return null
    const sorted = [...globalYearly].sort((a, b) => a.year - b.year)
    const latest = sorted[sorted.length - 1]
    // Sum the most recent decade as a "rolling export potential" headline
    const last10 = sorted.slice(-10)
    const decadeAvg = last10.reduce((s, d) => s + d.value_musd, 0) / last10.length
    return { latest, decadeAvg, decadeStart: last10[0].year, decadeEnd: latest.year }
  }, [globalYearly])

  if (l1 || l2 || l3)
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-slate-200/50 h-48 animate-pulse" />
      </div>
    )

  const windowEnd = topByValue[0]?.year_end
  const windowStart = topByValue[0]?.year_start

  return (
    <div className="space-y-8">
      <BriefingHero
        kpi="Market & End-Use"
        title="Export Value of"
        accent="Seaweed Products"
        description="Total value of seaweed products entering the market each year. FAO publishes production value, not trade flows, so the country breakdown below uses production value as a directional proxy — a true export figure would require UN Comtrade HS 1212.21 trade data."
        stats={[
          {
            value: stats
              ? `$${stats.latest.value_musd.toLocaleString(undefined, { maximumFractionDigits: 0 })}M`
              : '—',
            label: `Production value · ${stats?.latest?.year ?? '—'}`,
          },
          {
            value: stats
              ? `$${stats.decadeAvg.toLocaleString(undefined, { maximumFractionDigits: 0 })}M`
              : '—',
            label: `10-year avg · ${stats?.decadeStart ?? '—'}–${stats?.decadeEnd ?? '—'}`,
          },
          {
            value: topByValue[0]?.country ?? '—',
            label: `Top producer (proxy for top exporter) · ${windowStart}–${windowEnd}`,
          },
        ]}
      />

      {/* Caveat banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
          Methodology note
        </p>
        <p className="text-sm text-slate-700 mt-1.5 leading-relaxed">
          FAO FishStat reports aquaculture <em>production</em> value, not export
          (trade) value. This tab presents production value as a directional
          proxy. For true export figures, a UN Comtrade snapshot for HS&nbsp;1212.21
          would replace this dataset. The country ranking is generally
          consistent between the two — top producers are typically top
          exporters — but absolute $/year numbers include domestically-consumed
          product.
        </p>
      </div>

      {/* Headline KPI strip */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            variant="teal"
            label="Latest annual production value"
            value={`$${stats.latest.value_musd.toLocaleString(undefined, { maximumFractionDigits: 0 })}M`}
            subtext={`Global · ${stats.latest.year}`}
          />
          <KpiCard
            variant="cyan"
            label="10-year average"
            value={`$${stats.decadeAvg.toLocaleString(undefined, { maximumFractionDigits: 0 })}M`}
            subtext={`${stats.decadeStart}–${stats.decadeEnd}`}
          />
          <KpiCard
            variant="indigo"
            label="Top-value country"
            value={topByValue[0]?.country ?? '—'}
            subtext={
              topByValue[0]
                ? `$${topByValue[0].avg_value_musd.toFixed(1)}M/yr avg`
                : ''
            }
          />
        </div>
      )}

      {/* Global trend */}
      <TimeFilteredChartCard
        title="Global aquaculture production value (proxy for export value)"
        subtitle="Sum of all reporting countries' aquaculture VALUE rows per year, FAO FishStat. Single global series."
      >
        {([yMin, yMax]) => (
          <LineChart
            data={globalYearly.filter(d => d.year >= yMin && d.year <= yMax)}
            xKey="year"
            yKey="value_musd"
            yLabel="Million USD / year"
            height={360}
          />
        )}
      </TimeFilteredChartCard>

      {/* Top-5 country trajectories */}
      <TimeFilteredChartCard
        title="Top-5 producing countries · trajectory"
        subtitle="Per-country production value time series. The same five countries dominate the export tables over the past two decades."
      >
        {([yMin, yMax]) => (
          <LineChart
            data={countryYearly.filter(
              d =>
                top5Names.includes(d.country) &&
                d.year >= yMin &&
                d.year <= yMax,
            )}
            xKey="year"
            yKey="value_musd"
            groupKey="country"
            yLabel="Million USD / year"
            height={400}
          />
        )}
      </TimeFilteredChartCard>

      {/* Top contributors bar */}
      <ChartCard
        title={`Top countries by production value · ${windowStart}–${windowEnd} avg`}
        subtitle="Average annual aquaculture value per country, most recent 5-year reporting window. Direct proxy for relative export ranking."
      >
        <BarChart
          data={topByValue}
          labelKey="country"
          valueKey="avg_value_musd"
          xLabel="Million USD / year"
          format={v => `$${Number(v).toFixed(1)}M`}
          height={460}
        />
      </ChartCard>
    </div>
  )
}
