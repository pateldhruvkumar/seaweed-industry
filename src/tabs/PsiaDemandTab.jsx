import ChartWithInsights from '../components/ChartWithInsights'
import BarChart from '../components/charts/BarChart'
import RadarChart from '../components/charts/RadarChart'
import {
  BriefingHero,
  SectionHeader,
  PriorityLegend,
  ProjectedLineChart,
  FormSplitPanel,
} from '../components/psia'
import {
  FORM_SPLIT,
  END_USE_SPLIT,
  HYDROCOLLOID_MARKET,
  BC_VS_GLOBAL_RADAR,
  NA_EMERGING_APPS,
} from '../data/psia'

/**
 * PSIA Briefing — KPI 2 · Wet vs. Processed Kelp Demand
 *
 * 5 chart panels showing where the volume goes, what end-use channels are
 * scaling fastest, and where BC sits on the value-creation curve.
 */
export default function PsiaDemandTab() {
  return (
    <div className="space-y-10">
      <BriefingHero
        kpi="KPI 2"
        title="Wet vs. Processed"
        accent="Demand"
        description="The seaweed market increasingly trades as a processed input — dried, frozen, powdered, or extracted. Understanding where the value sits and which downstream channels are scaling fastest is the key strategic question for BC operators."
        stats={[
          { value: '80.6%', label: 'Global volume that moves dried / processed' },
          { value: '$13.6B', label: 'Hydrocolloid market in 2025 · 5% CAGR' },
          { value: '$3.2B', label: 'Biostimulants opportunity by 2030 (NA)' },
        ]}
      />

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
          <FormSplitPanel
            donut={FORM_SPLIT.donut}
            callouts={FORM_SPLIT.callouts}
          />
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
