import { useMemo } from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LabelList,
} from 'recharts'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import DataTable from '../components/DataTable'
import Plot from '../lib/Plot'
import BarChart from '../components/charts/BarChart'
import Heatmap from '../components/charts/Heatmap'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegendContent,
} from '../components/ui/chart'
import { PLOT_COLORS, GRID_COLOR, axisProps, buildSeriesConfig } from '../lib/chartTheme'

const DATASETS = ['global_production', 'aquaculture_quantity', 'aquaculture_value', 'capture_quantity']

const SUMMARY_COLS = [
  { key: 'dataset',     label: 'Dataset' },
  { key: 'rows',        label: 'Rows',        format: v => v?.toLocaleString() },
  { key: 'year_min',    label: 'From' },
  { key: 'year_max',    label: 'To' },
  { key: 'n_countries', label: 'Countries' },
  { key: 'n_species',   label: 'Species' },
  { key: 'mean',        label: 'Mean',        format: v => v?.toLocaleString(undefined, { maximumFractionDigits: 1 }) },
  { key: 'median',      label: 'Median',      format: v => v?.toLocaleString(undefined, { maximumFractionDigits: 1 }) },
  { key: 'std',         label: 'Std',         format: v => v?.toLocaleString(undefined, { maximumFractionDigits: 1 }) },
  { key: 'min',         label: 'Min',         format: v => v?.toLocaleString(undefined, { maximumFractionDigits: 1 }) },
  { key: 'p25',         label: 'p25',         format: v => v?.toLocaleString(undefined, { maximumFractionDigits: 1 }) },
  { key: 'p75',         label: 'p75',         format: v => v?.toLocaleString(undefined, { maximumFractionDigits: 1 }) },
  { key: 'max',         label: 'Max',         format: v => v?.toLocaleString(undefined, { maximumFractionDigits: 1 }) },
]

const QUALITY_COLS = [
  { key: 'dataset',           label: 'Dataset' },
  { key: 'rows',              label: 'Rows',             format: v => v?.toLocaleString() },
  { key: 'null_cells_total',  label: 'Null cells',       format: v => v?.toLocaleString() },
  { key: 'rows_with_any_null',label: 'Rows w/ nulls',    format: v => v?.toLocaleString() },
  { key: 'value_zeros',       label: 'VALUE = 0',        format: v => v?.toLocaleString() },
  { key: 'value_nulls',       label: 'VALUE nulls',      format: v => v?.toLocaleString() },
  { key: 'duplicate_rows',    label: 'Duplicates',       format: v => v?.toLocaleString() },
]

function StatusFlagBar({ title, records }) {
  if (!records?.length) return null
  return (
    <div className="flex-1 min-w-48">
      <p className="text-xs font-medium text-gray-500 mb-1 truncate">{title}</p>
      <ChartContainer config={{}} className="aspect-auto" style={{ width: '100%', height: '200px' }}>
        <RechartsBarChart data={records} layout="vertical" margin={{ top: 4, right: 48, bottom: 24, left: 8 }}>
          <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
          <XAxis type="number" domain={[0, 110]} {...axisProps} label={{ value: '%', position: 'insideBottom', offset: -8, fill: '#64748b', fontSize: 11 }} />
          <YAxis type="category" dataKey="status" {...axisProps} width={110} interval={0} />
          <ChartTooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltipContent valueFormatter={v => `${v}%`} />} />
          <Bar dataKey="pct" fill="#0d9488" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="pct" position="right" formatter={v => `${v}%`} style={{ fill: '#475569', fontSize: 10 }} />
          </Bar>
        </RechartsBarChart>
      </ChartContainer>
    </div>
  )
}

function MissingDataBar({ title, columns }) {
  const top = (columns ?? []).slice(0, 12)
  if (!top.length) return null
  return (
    <div className="flex-1 min-w-48">
      <p className="text-xs font-medium text-gray-500 mb-1 truncate">{title}</p>
      <ChartContainer config={{}} className="aspect-auto" style={{ width: '100%', height: '260px' }}>
        <RechartsBarChart data={top} layout="vertical" margin={{ top: 4, right: 48, bottom: 24, left: 8 }}>
          <CartesianGrid stroke={GRID_COLOR} horizontal={false} />
          <XAxis type="number" domain={[0, 110]} {...axisProps} label={{ value: '% null', position: 'insideBottom', offset: -8, fill: '#64748b', fontSize: 11 }} />
          <YAxis type="category" dataKey="column" {...axisProps} width={150} interval={0} />
          <ChartTooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltipContent valueFormatter={v => `${v}%`} />} />
          <Bar dataKey="null_pct" fill="#0d9488" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="null_pct" position="right" formatter={v => `${v}%`} style={{ fill: '#475569', fontSize: 10 }} />
          </Bar>
        </RechartsBarChart>
      </ChartContainer>
    </div>
  )
}

function ValueHistogram({ title, bins }) {
  if (!bins?.length) return null
  const rows = bins.map(b => ({
    center: ((b.bin_start + b.bin_end) / 2).toFixed(2),
    count: b.count,
  }))
  return (
    <div className="flex-1 min-w-48">
      <p className="text-xs font-medium text-gray-500 mb-1 truncate">{title}</p>
      <ChartContainer config={{}} className="aspect-auto" style={{ width: '100%', height: '220px' }}>
        <RechartsBarChart data={rows} margin={{ top: 8, right: 12, bottom: 24, left: 8 }} barCategoryGap={1}>
          <CartesianGrid stroke={GRID_COLOR} vertical={false} />
          <XAxis dataKey="center" {...axisProps} label={{ value: 'log₁₀(VALUE)', position: 'insideBottom', offset: -8, fill: '#64748b', fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis {...axisProps} label={{ value: 'count', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
          <ChartTooltip cursor={{ fill: '#f1f5f9' }} content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="#0f766e" />
        </RechartsBarChart>
      </ChartContainer>
    </div>
  )
}

function OutlierBox({ title, stats }) {
  if (!stats) return null
  const pct = stats.total ? ((stats.n_outliers / stats.total) * 100).toFixed(2) : '0.00'
  return (
    <div className="flex-1 min-w-48">
      <p className="text-xs font-medium text-gray-500 mb-1 truncate">{title}</p>
      <Plot
        data={[{
          type: 'box',
          orientation: 'h',
          q1:             [stats.q1],
          median:         [stats.median],
          q3:             [stats.q3],
          lowerfence:     [stats.lower_whisker],
          upperfence:     [stats.upper_whisker],
          name: '',
          marker: { color: '#0d9488' },
          line:   { color: '#0f766e' },
        }]}
        layout={{
          template: 'plotly_white',
          autosize: true,
          margin: { t: 5, r: 10, b: 35, l: 30 },
          xaxis: { title: 'log₁₀(VALUE)' },
          showlegend: false,
        }}
        useResizeHandler
        style={{ width: '100%', height: '180px' }}
        config={{ displaylogo: false, displayModeBar: false }}
      />
      <p className="text-[11px] text-slate-500 mt-1">
        {stats.n_outliers.toLocaleString()} outliers flagged of{' '}
        {stats.total.toLocaleString()} records ({pct}%)
      </p>
    </div>
  )
}

/**
 * Reshape per-dataset year series into wide rows for Recharts:
 *   [{ year, ds1: v, ds2: v, ... }, ...]
 */
function uniquePerYearRows(uniqueByDs, metric) {
  if (!uniqueByDs) return []
  const years = new Set()
  DATASETS.forEach(ds => (uniqueByDs[ds] ?? []).forEach(r => years.add(r.year)))
  const sorted = [...years].sort((a, b) => a - b)
  return sorted.map(y => {
    const row = { year: y }
    DATASETS.forEach(ds => {
      const hit = (uniqueByDs[ds] ?? []).find(r => r.year === y)
      row[ds] = hit ? hit[metric] : null
    })
    return row
  })
}

/** Same shape but for records-per-year (records array, sums by dataset). */
function recordsPerYearRows(recRows) {
  if (!recRows.length) return []
  const years = [...new Set(recRows.map(r => r.year))].sort((a, b) => a - b)
  return years.map(y => {
    const row = { year: y }
    DATASETS.forEach(ds => {
      const hit = recRows.find(r => r.year === y && r.dataset === ds)
      row[ds] = hit ? hit.count : null
    })
    return row
  })
}

const DATASET_CONFIG = buildSeriesConfig(DATASETS)

function DatasetLineChart({ rows, yLabel, height }) {
  if (!rows.length) return null
  return (
    <ChartContainer config={DATASET_CONFIG} className="aspect-auto" style={{ width: '100%', height: `${height}px` }}>
      <RechartsLineChart data={rows} margin={{ top: 10, right: 16, bottom: 24, left: 8 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="year" {...axisProps} label={{ value: 'Year', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }} />
        <YAxis {...axisProps} label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }} />
        <ChartTooltip cursor={{ stroke: '#e2e8f0' }} content={<ChartTooltipContent />} />
        <Legend content={<ChartLegendContent />} />
        {DATASETS.map((ds, i) => (
          <Line
            key={ds}
            type="monotone"
            dataKey={ds}
            stroke={PLOT_COLORS[i % PLOT_COLORS.length]}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  )
}

export default function EdaTab() {
  const { data: summary, loading: lSum }  = useData('eda_summary_stats.json')
  const { data: missing, loading: lMiss } = useData('eda_missing_data.json')
  const { data: valDist, loading: lVal }  = useData('value_distribution.json')
  const { data: uniqYr,  loading: lUniq } = useData('eda_unique_per_year.json')
  const { data: countryTotals, loading: lCT } = useData('country_totals.json')
  const { data: speciesTotals, loading: lST } = useData('species_totals.json')
  const { data: envQuantity,   loading: lEQ } = useData('env_quantity.json')
  const { data: scatter, loading: lSc } = useData('eda_value_quantity_scatter.json')
  const { data: corr,    loading: lCr } = useData('eda_country_correlation.json')
  const { data: outliers, loading: lOut } = useData('eda_outliers.json')
  const { data: recData,    loading: lRec }    = useData('records_per_year.json')
  const { data: statusData, loading: lStatus } = useData('status_distribution.json')

  const recRows     = recData?.records ?? []
  const qualSummary = recData?.quality_summary ?? {}

  const qualityTableData = useMemo(() =>
    DATASETS.map(ds => ({ dataset: ds, ...(qualSummary[ds] ?? {}) })),
    [qualSummary]
  )

  const recYearRows = useMemo(() => recordsPerYearRows(recRows), [recRows])
  const countryYearRows = useMemo(() => uniquePerYearRows(uniqYr, 'n_countries'), [uniqYr])
  const speciesYearRows = useMemo(() => uniquePerYearRows(uniqYr, 'n_species'), [uniqYr])

  const top10Countries = useMemo(() => {
    if (!countryTotals?.length) return []
    const latestStart = Math.max(...countryTotals.map(r => r.year_start))
    return countryTotals
      .filter(r => r.year_start === latestStart)
      .slice()
      .sort((a, b) => b.avg_tonnes_mt - a.avg_tonnes_mt)
      .slice(0, 10)
  }, [countryTotals])

  const top10Species = useMemo(() => {
    if (!speciesTotals?.length) return []
    const latestStart = Math.max(...speciesTotals.map(r => r.year_start))
    return speciesTotals
      .filter(r => r.year_start === latestStart)
      .slice()
      .sort((a, b) => b.avg_tonnes_mt - a.avg_tonnes_mt)
      .slice(0, 10)
  }, [speciesTotals])

  const envTotals = useMemo(() => {
    const sums = {}
    for (const r of (envQuantity ?? [])) {
      sums[r.environment] = (sums[r.environment] ?? 0) + r.value_mt
    }
    return Object.entries(sums).map(([environment, total_mt]) => ({ environment, total_mt }))
  }, [envQuantity])

  const heatmapData = useMemo(() => {
    if (!corr) return null
    return {
      countries: corr.countries,
      species: corr.countries,  // axes share the country list
      values: corr.matrix,
    }
  }, [corr])

  if (lSum || lMiss || lVal || lUniq || lCT || lST || lEQ || lSc || lCr || lOut || lRec || lStatus) return <div className="p-12 text-center text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      <ChartCard title="Dataset summary statistics">
        <DataTable columns={SUMMARY_COLS} data={summary ?? []} />
      </ChartCard>

      <ChartCard title="Data quality summary">
        <DataTable columns={QUALITY_COLS} data={qualityTableData} />
      </ChartCard>

      <ChartCard title="Missing-data % per column (top 12 columns per dataset)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DATASETS.map(ds => (
            <MissingDataBar key={ds} title={ds} columns={missing?.[ds]} />
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Data quality flag distribution per dataset (% of records)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DATASETS.map(ds => (
            <StatusFlagBar key={ds} title={ds} records={statusData?.[ds]} />
          ))}
        </div>
      </ChartCard>

      <ChartCard title="VALUE distribution on log₁₀ scale (non-zero records)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DATASETS.map(ds => (
            <ValueHistogram key={ds} title={ds} bins={valDist?.[ds]} />
          ))}
        </div>
      </ChartCard>

      <ChartCard title="Number of records reported per year, by dataset">
        <DatasetLineChart rows={recYearRows} yLabel="Records" height={360} />
      </ChartCard>

      <ChartCard title="Unique countries reporting per year, by dataset">
        <DatasetLineChart rows={countryYearRows} yLabel="Countries" height={320} />
      </ChartCard>

      <ChartCard title="Unique species reporting per year, by dataset">
        <DatasetLineChart rows={speciesYearRows} yLabel="Species" height={320} />
      </ChartCard>

      <ChartCard title="Top 10 countries by avg annual production (most recent 5-year window)">
        <BarChart
          data={top10Countries}
          labelKey="country"
          valueKey="avg_tonnes_mt"
          orientation="horizontal"
          xLabel="Avg annual production (MT)"
          height={360}
        />
      </ChartCard>

      <ChartCard title="Top 10 species by avg annual production (most recent 5-year window)">
        <BarChart
          data={top10Species}
          labelKey="species"
          valueKey="avg_tonnes_mt"
          orientation="horizontal"
          xLabel="Avg annual production (MT)"
          height={360}
        />
      </ChartCard>

      <ChartCard title="Total production by environment (MT, all years)">
        <BarChart
          data={envTotals}
          labelKey="environment"
          valueKey="total_mt"
          orientation="horizontal"
          xLabel="Total production (MT)"
          height={240}
        />
      </ChartCard>

      <ChartCard title="Aquaculture: value vs. quantity (log–log, country-species-year)">
        <ChartContainer config={{}} className="aspect-auto" style={{ width: '100%', height: '460px' }}>
          <RechartsScatterChart margin={{ top: 10, right: 16, bottom: 32, left: 16 }}>
            <CartesianGrid stroke={GRID_COLOR} />
            <XAxis
              type="number"
              dataKey="qty"
              scale="log"
              domain={['auto', 'auto']}
              allowDataOverflow
              {...axisProps}
              label={{ value: 'Quantity (tonnes)', position: 'insideBottom', offset: -8, fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="value"
              scale="log"
              domain={['auto', 'auto']}
              allowDataOverflow
              {...axisProps}
              label={{ value: 'Value (USD)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
            />
            <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent hideLabel />} />
            <Scatter
              data={(scatter ?? []).filter(d => d.qty > 0 && d.value > 0)}
              fill="#0d9488"
              fillOpacity={0.5}
              shape="circle"
              isAnimationActive={false}
            />
          </RechartsScatterChart>
        </ChartContainer>
      </ChartCard>

      <ChartCard title="Top-20 country production correlation (Pearson, year-over-year)">
        <Heatmap
          data={heatmapData}
          height={520}
          colorscale="RdBu"
          colorbarTitle="Pearson r"
          valueFormat={v => v.toFixed(2)}
          xLabel=""
          yLabel="Country"
          xTickAngle={-45}
          zmin={-1}
          zmax={1}
        />
      </ChartCard>

      <ChartCard title="Outliers — IQR rule on log₁₀(VALUE)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DATASETS.map(ds => (
            <OutlierBox key={ds} title={ds} stats={outliers?.[ds]} />
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
