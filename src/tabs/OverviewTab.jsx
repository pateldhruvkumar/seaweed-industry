import { useMemo } from 'react'
import { useYear } from '../context/YearContext'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import KpiCard from '../components/KpiCard'
import AreaChart from '../components/charts/AreaChart'
import LineChart from '../components/charts/LineChart'

/**
 * Overview tab — the dashboard's "front page".
 *
 * Layout:
 *   1. KPI strip (4 pastel tiles) — at-a-glance numbers vs. prior period
 *   2. Stacked-area headline chart — the visual story of the industry
 *   3. Aquaculture share trend
 *   4. Linear / log capture-vs-aquaculture pair (side-by-side on lg+)
 */
export default function OverviewTab() {
  const {
    yearRange: [yMin, yMax],
  } = useYear()

  const { data: prodData,    loading: l1 } = useData('global_production_by_source.json')
  const { data: shareData,   loading: l2 } = useData('aquaculture_share.json')
  const { data: captureData, loading: l3 } = useData('capture_vs_aquaculture.json')
  const { data: countryTotals, loading: l4 } = useData('country_totals.json')
  const { data: speciesTotals, loading: l5 } = useData('species_totals.json')

  const prod  = useMemo(() => prodData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [prodData, yMin, yMax])
  const share = useMemo(() => shareData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [shareData, yMin, yMax])
  const cap   = useMemo(() => captureData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [], [captureData, yMin, yMax])

  // KPI computations — keyed off the *full* dataset (not the filtered window)
  // so the headline numbers stay "as of latest year" regardless of slider.
  const kpis = useMemo(() => {
    if (!prodData || !shareData || !countryTotals || !speciesTotals) return null

    const latestYear = Math.max(...prodData.map(d => d.year))
    const prevYear = latestYear - 1

    const sumYear = y =>
      prodData.filter(d => d.year === y).reduce((s, d) => s + d.value_mt, 0)
    const totalLatest = sumYear(latestYear)
    const totalPrev = sumYear(prevYear)
    const yoy = totalPrev > 0 ? ((totalLatest - totalPrev) / totalPrev) * 100 : null

    const shareLatest = shareData.find(d => d.year === latestYear)?.share_pct
    const sharePrev = shareData.find(d => d.year === prevYear)?.share_pct
    const sharePtChange =
      shareLatest != null && sharePrev != null ? shareLatest - sharePrev : null

    // Active producing countries — most recent 5-year window in country_totals.
    const latestEnd = Math.max(...countryTotals.map(d => d.year_end))
    const latestWindow = countryTotals.filter(d => d.year_end === latestEnd)
    const countryCount = latestWindow.filter(d => d.avg_tonnes_mt > 0).length

    // Top species in same window.
    const recentSpecies = speciesTotals.filter(d => d.year_end === latestEnd)
    const topSpecies = recentSpecies.sort((a, b) => b.avg_tonnes_mt - a.avg_tonnes_mt)[0]
    const windowStart = recentSpecies[0]?.year_start

    return {
      latestYear,
      totalLatest,
      yoy,
      shareLatest,
      sharePtChange,
      countryCount,
      windowStart,
      windowEnd: latestEnd,
      topSpeciesName: topSpecies?.species,
      topSpeciesValue: topSpecies?.avg_tonnes_mt,
    }
  }, [prodData, shareData, countryTotals, speciesTotals])

  if (l1 || l2 || l3 || l4 || l5) {
    return (
      <div className="space-y-6">
        <KpiSkeletonStrip />
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card h-96 animate-pulse" />
      </div>
    )
  }

  const capLinear = cap.flatMap(d => [
    { year: d.year, series: 'Capture',     value: d.capture_mt },
    { year: d.year, series: 'Aquaculture', value: d.aquaculture_mt },
  ])

  return (
    <div className="space-y-6">
      {/* ── KPI strip ───────────────────────────────────────────── */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            variant="teal"
            label="Total output"
            value={`${kpis.totalLatest.toFixed(1)} Mt`}
            subtext={`As of ${kpis.latestYear}`}
            trend={
              kpis.yoy != null
                ? {
                    dir: kpis.yoy >= 0 ? 'up' : 'down',
                    text: `${kpis.yoy >= 0 ? '+' : ''}${kpis.yoy.toFixed(1)}% YoY`,
                  }
                : undefined
            }
          />
          <KpiCard
            variant="cyan"
            label="Aquaculture share"
            value={
              kpis.shareLatest != null ? `${kpis.shareLatest.toFixed(1)}%` : '—'
            }
            subtext={`of total tonnage · ${kpis.latestYear}`}
            trend={
              kpis.sharePtChange != null
                ? {
                    dir: kpis.sharePtChange >= 0 ? 'up' : 'down',
                    text: `${kpis.sharePtChange >= 0 ? '+' : ''}${kpis.sharePtChange.toFixed(2)} pp`,
                  }
                : undefined
            }
          />
          <KpiCard
            variant="indigo"
            label="Producing countries"
            value={kpis.countryCount.toString()}
            subtext={`Active in ${kpis.windowStart}–${kpis.windowEnd}`}
          />
          <KpiCard
            variant="emerald"
            label="Top species"
            value={kpis.topSpeciesName ?? '—'}
            subtext={
              kpis.topSpeciesValue
                ? `${kpis.topSpeciesValue.toFixed(2)} Mt/yr avg`
                : ''
            }
          />
        </div>
      )}

      {/* ── Headline stacked area ───────────────────────────────── */}
      <ChartCard
        title="Global seaweed production by source"
        subtitle="Million tonnes live weight, 1950–2024. Aquaculture (3 environments) now dwarfs wild capture."
      >
        <AreaChart
          data={prod}
          groupKey="source"
          valueKey="value_mt"
          yLabel="Million tonnes"
        />
      </ChartCard>

      {/* ── Aquaculture share over time ─────────────────────────── */}
      <ChartCard
        title="Aquaculture as a share of global seaweed production"
        subtitle="Percent of total tonnage — illustrates the long-term shift from wild harvest to farmed output."
      >
        <LineChart data={share} yKey="share_pct" yLabel="% of total tonnage" />
      </ChartCard>

      {/* ── Linear / log pair ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Capture vs. aquaculture · linear scale"
          subtitle="Million tonnes per year. Modern dominance of aquaculture is clear."
        >
          <LineChart
            data={capLinear}
            yKey="value"
            groupKey="series"
            yLabel="Million tonnes / year"
            height={340}
          />
        </ChartCard>

        <ChartCard
          title="Capture vs. aquaculture · log scale"
          subtitle="Same data on a log axis reveals the early decades of aquaculture growth."
        >
          <LineChart
            data={capLinear}
            yKey="value"
            groupKey="series"
            yLabel="Million tonnes / year (log)"
            yLog
            height={340}
          />
        </ChartCard>
      </div>
    </div>
  )
}

/** Placeholder strip while JSON is still loading. */
function KpiSkeletonStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200/70 bg-white shadow-card p-5 h-[120px] animate-pulse"
        />
      ))}
    </div>
  )
}
