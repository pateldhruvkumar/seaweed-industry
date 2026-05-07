import ChartWithInsights from '../components/ChartWithInsights'
import AreaChart from '../components/charts/AreaChart'
import BarChart from '../components/charts/BarChart'
import LineChart from '../components/charts/LineChart'
import {
  BriefingHero,
  SectionHeader,
  TierLegend,
  GroupedRangeBars,
} from '../components/psia'
import {
  GLOBAL_AQUA_TREND,
  SPECIES_PRICES_2022,
  SPECIES_PRICE_TREND,
  TOP_COUNTRIES_VALUE,
  BC_PRICE_BENCHMARKS,
} from '../data/psia'

/**
 * PSIA Briefing — KPI 1 · Price per Wet Tonne by Species & End Use ($/tonne)
 *
 * 5 chart panels translated from the source PDF. The layout pattern (chart
 * left ~70%, key-notes right ~30%) is shared with the demand briefing via
 * ChartWithInsights so the two tabs read as one coherent series.
 */
export default function PsiaPricingTab() {
  return (
    <div className="space-y-10">
      <BriefingHero
        kpi="KPI 1"
        title="Price per"
        accent="Wet Tonne"
        description="Global $/tonne benchmarks by species and end-use, plus a first look at where BC fits in the picture. Asian farmgate prices are the dominant series in FAO data — the question is how much of a premium BC's certified, food-grade kelp can command."
        stats={[
          { value: '$1,351/t', label: 'Kelps NEI · 2022 · stable for 12 years' },
          { value: '74%',      label: 'China share of global aquaculture value' },
          { value: '< 0.01%',  label: 'Canada share of global volume' },
        ]}
      />

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
              color: d.highlight ? '#dc2626' : '#0d9488',
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
    </div>
  )
}
