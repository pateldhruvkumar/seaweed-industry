import { useMemo } from 'react'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import TimeFilteredChartCard from '../components/TimeFilteredChartCard'
import KpiCard from '../components/KpiCard'
import LineChart from '../components/charts/LineChart'
import AreaChart from '../components/charts/AreaChart'
import BarChart from '../components/charts/BarChart'
import { BriefingHero } from '../components/psia'

/**
 * KPI · Gross Value of Seaweed Industry Output ($/year)
 *
 * The big-picture economic-output KPI. Pulls together total dollar output
 * of global seaweed aquaculture, decomposed by farming environment and
 * by top contributing countries.
 *
 * Data sources (FAO, all preprocessed):
 *   - global_aquaculture_value_yearly.json — single yearly total
 *   - value_by_env_yearly.json             — same total, stacked by env
 *   - country_value_volume.json            — top countries by 5-yr window
 */
export default function KpiGrossOutputTab() {
  const { data: globalYearly, loading: l1 } = useData(
    'global_aquaculture_value_yearly.json',
  )
  const { data: byEnv, loading: l2 } = useData('value_by_env_yearly.json')
  const { data: countryWindowed, loading: l3 } = useData(
    'country_value_volume.json',
  )

  // KPI numerics — anchored on the latest available year, not the slider.
  const stats = useMemo(() => {
    if (!globalYearly || !globalYearly.length) return null
    const latest = globalYearly[globalYearly.length - 1]
    const prev = globalYearly[globalYearly.length - 2]
    const peak = globalYearly.reduce(
      (a, b) => (b.value_musd > a.value_musd ? b : a),
      globalYearly[0],
    )
    const yoy =
      prev && prev.value_musd > 0
        ? ((latest.value_musd - prev.value_musd) / prev.value_musd) * 100
        : null
    return { latest, prev, peak, yoy }
  }, [globalYearly])

  // Top contributing countries — most recent 5-year window in country_value_volume
  const topByValue = useMemo(() => {
    if (!countryWindowed) return []
    const latestEnd = Math.max(...countryWindowed.map(d => d.year_end))
    return countryWindowed
      .filter(d => d.year_end === latestEnd)
      .sort((a, b) => b.avg_value_musd - a.avg_value_musd)
      .slice(0, 10)
  }, [countryWindowed])

  if (l1 || l2 || l3) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-slate-200/50 h-48 animate-pulse" />
      </div>
    )
  }

  const latestYear = stats?.latest?.year
  const peakYear = stats?.peak?.year
  const windowEnd = topByValue[0]?.year_end
  const windowStart = topByValue[0]?.year_start

  return (
    <div className="space-y-8">
      <BriefingHero
        kpi="Market & End-Use"
        title="Gross Value of"
        accent="Seaweed Industry Output"
        description="Total economic output of global seaweed aquaculture, in million USD per year, derived from FAO FishStat country-by-species value records. Capture (wild harvest) is excluded — FAO only publishes value for the aquaculture stream."
        stats={[
          {
            value: stats
              ? `$${stats.latest.value_musd.toLocaleString(undefined, { maximumFractionDigits: 0 })}M`
              : '—',
            label: `Latest reported year · ${latestYear ?? '—'}`,
          },
          {
            value: stats
              ? `$${stats.peak.value_musd.toLocaleString(undefined, { maximumFractionDigits: 0 })}M`
              : '—',
            label: `Peak year · ${peakYear ?? '—'}`,
          },
          {
            value:
              stats?.yoy != null
                ? `${stats.yoy >= 0 ? '+' : ''}${stats.yoy.toFixed(1)}%`
                : '—',
            label: `Year-over-year · ${latestYear ?? '—'} vs ${stats?.prev?.year ?? '—'}`,
          },
        ]}
      />

      {/* Headline KPI strip */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            variant="teal"
            label="Latest output"
            value={`$${stats.latest.value_musd.toLocaleString(undefined, { maximumFractionDigits: 0 })}M`}
            subtext={`Global aquaculture · ${latestYear}`}
            trend={
              stats.yoy != null
                ? {
                    dir: stats.yoy >= 0 ? 'up' : 'down',
                    text: `${stats.yoy >= 0 ? '+' : ''}${stats.yoy.toFixed(1)}% YoY`,
                  }
                : undefined
            }
          />
          <KpiCard
            variant="cyan"
            label="Peak output"
            value={`$${stats.peak.value_musd.toLocaleString(undefined, { maximumFractionDigits: 0 })}M`}
            subtext={`Reached in ${peakYear}`}
          />
          <KpiCard
            variant="indigo"
            label="Top producer (by value)"
            value={topByValue[0]?.country ?? '—'}
            subtext={
              topByValue[0]
                ? `$${(topByValue[0].avg_value_musd).toFixed(1)}M/yr · ${windowStart}–${windowEnd}`
                : ''
            }
          />
        </div>
      )}

      {/* Global value time series */}
      <TimeFilteredChartCard
        title="Global aquaculture value over time"
        subtitle="Total across all producing countries, species, and environments. FAO FishStat aquaculture VALUE table, summed by year."
      >
        {([yMin, yMax]) => (
          <LineChart
            data={globalYearly.filter(d => d.year >= yMin && d.year <= yMax)}
            xKey="year"
            yKey="value_musd"
            yLabel="Million USD / year"
            height={380}
          />
        )}
      </TimeFilteredChartCard>

      {/* Stacked by environment */}
      <TimeFilteredChartCard
        title="Industry output by farming environment"
        subtitle="Same total as above, decomposed across Marine, Brackish water, and Inland/freshwater aquaculture."
      >
        {([yMin, yMax]) => (
          <AreaChart
            data={byEnv.filter(d => d.year >= yMin && d.year <= yMax)}
            groupKey="environment"
            valueKey="value_musd"
            yLabel="Million USD / year"
            height={400}
          />
        )}
      </TimeFilteredChartCard>

      {/* Top contributing countries */}
      <ChartCard
        title={`Top 10 contributing countries · ${windowStart}–${windowEnd} avg`}
        subtitle="Average annual aquaculture value per country, most recent 5-year reporting window."
      >
        <BarChart
          data={topByValue}
          labelKey="country"
          valueKey="avg_value_musd"
          xLabel="Million USD / year"
          format={v => `$${Number(v).toFixed(1)}M`}
          height={420}
        />
      </ChartCard>
    </div>
  )
}
