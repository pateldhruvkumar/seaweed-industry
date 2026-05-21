import { useMemo } from 'react'
import { useData } from '../hooks/useData'
import TimeFilteredChartCard from '../components/TimeFilteredChartCard'
import LineChart from '../components/charts/LineChart'
import { BriefingHero } from '../components/psia'

/**
 * KPI · Export Value of Seaweed Products ($/year)
 *
 * IMPORTANT CAVEAT: FAO FishStat does NOT publish trade (export) statistics.
 * It only reports aquaculture *production* volume and value. The country
 * trajectories shown below are FAO production-value series and are NOT
 * export figures. For real export numbers, UN Comtrade HS code 1212.21
 * (Seaweeds and other algae, fit for human consumption) — plus 1302.31
 * (agar) and 1302.39 (carrageenan/alginates) for the hydrocolloid trade —
 * would need to be added to the data pipeline.
 *
 * The Gross Value tab already shows the global total and top-country bar;
 * this tab keeps only the per-country trajectory view, which is the one
 * angle Gross Value doesn't have. Once Comtrade data lands, real export
 * charts will slot in below the trajectory.
 */
export default function KpiExportValueTab() {
  const { data: countryYearly, loading: l1 } = useData('country_value_yearly.json')
  const { data: countryWindow, loading: l2 } = useData('country_value_volume.json')

  // The 5 countries to highlight are picked from the most recent 5-year
  // window, independent of the user's per-chart year-slider below.
  const top5Names = useMemo(() => {
    if (!countryWindow) return []
    const latestEnd = Math.max(...countryWindow.map(d => d.year_end))
    return countryWindow
      .filter(d => d.year_end === latestEnd)
      .sort((a, b) => b.avg_value_musd - a.avg_value_musd)
      .slice(0, 5)
      .map(d => d.country)
  }, [countryWindow])

  if (l1 || l2)
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-slate-200/50 h-48 animate-pulse" />
      </div>
    )

  return (
    <div className="space-y-8">
      <BriefingHero
        kpi="Market & End-Use"
        title="Export Value of"
        accent="Seaweed Products"
        description="Total value of seaweed products entering international trade each year. FAO publishes production value, not trade flows — see the caveat below. The Gross Value tab shows the global total and country ranking; this tab focuses on per-country growth trajectories."
        stats={[
          { value: 'HS 1212.21', label: 'Target Comtrade commodity code' },
          { value: '+1302.31 / .39', label: 'Hydrocolloid (agar / carrageenan) codes' },
          { value: 'Pending',    label: 'Real export data integration' },
        ]}
      />

      {/* Caveat banner — deliberately loud so the proxy nature is unmissable */}
      <div className="rounded-xl border-2 border-amber-400 bg-amber-50 px-6 py-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="shrink-0 w-9 h-9 rounded-full bg-amber-400 text-white grid place-items-center text-lg font-bold"
          >
            !
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-wider text-amber-800">
              Production trajectories shown · not true export data
            </p>
            <p className="text-sm text-slate-800 mt-2 leading-relaxed">
              The chart below is FAO FishStat aquaculture{' '}
              <strong>production</strong> value, not trade (export) flows.
              FAO does not publish export statistics. The growth shapes
              are real, but the absolute dollars include
              domestically-consumed product and must not be cited as
              export numbers.
            </p>
            <p className="text-sm text-slate-700 mt-2 leading-relaxed">
              Real export figures require UN Comtrade HS&nbsp;1212.21
              (seaweed for human consumption) plus HS&nbsp;1302.31 and
              1302.39 (agar and carrageenan/alginates). Once those land
              in the pipeline, real export charts will appear here and
              the country rankings will look different — South Korea
              becomes the largest exporter, Japan flips to net importer.
            </p>
          </div>
        </div>
      </div>

      {/* Top-5 country trajectories — the one unique view on this tab */}
      <TimeFilteredChartCard
        title="Per-country aquaculture production growth, 1984–2024"
        subtitle="Top 5 countries by recent average value. Production value, not exports — see the note above."
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
            height={420}
          />
        )}
      </TimeFilteredChartCard>
    </div>
  )
}
