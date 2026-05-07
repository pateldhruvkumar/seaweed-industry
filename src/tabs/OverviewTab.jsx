import { useMemo } from 'react'
import { useYear } from '../context/YearContext'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import KpiCard from '../components/KpiCard'
import AreaChart from '../components/charts/AreaChart'
import LineChart from '../components/charts/LineChart'
import { IconActivity, IconWaves, IconGlobe, IconLeaf } from '../lib/icons'

/**
 * Overview tab — the dashboard's "front page".
 *
 * Layout:
 *   1. KPI strip (4 tiles)            — at-a-glance numbers
 *   2. Stacked-area headline chart     — the visual story of the industry
 *   3. Two complementary line charts   — context on the headline
 */
export default function OverviewTab() {
  const {
    yearRange: [yMin, yMax],
  } = useYear()

  const { data: prodData, loading: l1 } = useData('global_production_by_source.json')
  const { data: shareData, loading: l2 } = useData('aquaculture_share.json')
  const { data: captureData, loading: l3 } = useData('capture_vs_aquaculture.json')
  const { data: countryTotals, loading: l4 } = useData('country_totals.json')
  const { data: speciesTotals, loading: l5 } = useData('species_totals.json')

  const prod = useMemo(
    () => prodData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [],
    [prodData, yMin, yMax],
  )
  const share = useMemo(
    () => shareData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [],
    [shareData, yMin, yMax],
  )
  const cap = useMemo(
    () => captureData?.filter(d => d.year >= yMin && d.year <= yMax) ?? [],
    [captureData, yMin, yMax],
  )

  // KPI computations — keyed off the *full* dataset (not the filtered window),
  // so the headline numbers are always "as of the latest available year",
  // regardless of how the user slides the global filter.
  const kpis = useMemo(() => {
    if (!prodData || !shareData || !countryTotals || !speciesTotals) return null

    const latestYear = Math.max(...prodData.map(d => d.year))
    const totalLatest = prodData
      .filter(d => d.year === latestYear)
      .reduce((sum, d) => sum + d.value_mt, 0)

    const shareLatest = shareData.find(d => d.year === latestYear)?.share_pct

    // For "active producing countries" use the most recent 5-year window.
    const recentWindow = countryTotals
      .filter(d => d.year_end === latestYear || d.year_end === latestYear - 1 || d.year_end === latestYear)
      .sort((a, b) => b.year_end - a.year_end)
    const recentEnd = recentWindow[0]?.year_end
    const countryCount = recentWindow.filter(d => d.year_end === recentEnd && d.avg_tonnes_mt > 0).length

    // Top species by output in the same window.
    const recentSpecies = speciesTotals.filter(d => d.year_end === recentEnd)
    const topSpecies = recentSpecies.sort((a, b) => b.avg_tonnes_mt - a.avg_tonnes_mt)[0]

    return {
      latestYear,
      totalLatest,
      shareLatest,
      countryCount,
      windowStart: recentSpecies[0]?.year_start,
      windowEnd: recentEnd,
      topSpeciesName: topSpecies?.species,
      topSpeciesValue: topSpecies?.avg_tonnes_mt,
    }
  }, [prodData, shareData, countryTotals, speciesTotals])

  if (l1 || l2 || l3 || l4 || l5) {
    return (
      <div className="space-y-6">
        <KpiSkeletonStrip />
        <div className="bg-white rounded-xl border border-slate-200/70 shadow-card h-96 animate-pulse" />
      </div>
    )
  }

  const capLinear = cap.flatMap(d => [
    { year: d.year, series: 'Capture', value: d.capture_mt },
    { year: d.year, series: 'Aquaculture', value: d.aquaculture_mt },
  ])

  return (
    <div className="space-y-6">
      {/* ── KPI strip ───────────────────────────────────────────── */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            icon={IconActivity}
            label="Latest year output"
            value={`${kpis.totalLatest.toFixed(1)} Mt`}
            subtext={`Global production · ${kpis.latestYear}`}
            accent="bg-brand-50 text-brand-600"
          />
          <KpiCard
            icon={IconWaves}
            label="Aquaculture share"
            value={kpis.shareLatest != null ? `${kpis.shareLatest.toFixed(1)}%` : '—'}
            subtext={`of total tonnage · ${kpis.latestYear}`}
            accent="bg-cyan-50 text-cyan-600"
          />
          <KpiCard
            icon={IconGlobe}
            label="Producing countries"
            value={kpis.countryCount.toString()}
            subtext={`Active in ${kpis.windowStart}–${kpis.windowEnd}`}
            accent="bg-indigo-50 text-indigo-600"
          />
          <KpiCard
            icon={IconLeaf}
            label="Top species / group"
            value={kpis.topSpeciesName ?? '—'}
            subtext={
              kpis.topSpeciesValue
                ? `${kpis.topSpeciesValue.toFixed(2)} Mt/yr avg`
                : ''
            }
            accent="bg-emerald-50 text-emerald-600"
          />
        </div>
      )}

      {/* ── Headline area chart ─────────────────────────────────── */}
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

      {/* ── Linear vs. log capture/aquaculture comparison ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Capture vs. aquaculture — linear scale"
          subtitle="Million tonnes per year. Modern dominance of aquaculture is visible."
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
          title="Capture vs. aquaculture — log scale"
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

/** Placeholder strip while the JSON files are still loading. */
function KpiSkeletonStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-200/70 shadow-card p-5 h-[104px] animate-pulse"
        />
      ))}
    </div>
  )
}
