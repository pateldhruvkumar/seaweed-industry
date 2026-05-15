import { useMemo } from 'react'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import DataTable from '../components/DataTable'
import Plot from '../lib/Plot'
import BarChart from '../components/charts/BarChart'
import Heatmap from '../components/charts/Heatmap'

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
      <Plot
        data={[{
          x: records.map(r => r.pct),
          y: records.map(r => r.status),
          type: 'bar',
          orientation: 'h',
          marker: { color: '#0d9488' },
          text: records.map(r => `${r.pct}%`),
          textposition: 'outside',
        }]}
        layout={{
          template: 'plotly_white',
          autosize: true,
          margin: { t: 5, r: 50, b: 30, l: 120 },
          xaxis: { title: '%', range: [0, 110] },
          yaxis: { autorange: 'reversed' },
        }}
        useResizeHandler
        style={{ width: '100%', height: '200px' }}
        config={{ displaylogo: false, displayModeBar: false }}
      />
    </div>
  )
}

function MissingDataBar({ title, columns }) {
  const top = (columns ?? []).slice(0, 12)  // most-null columns first
  if (!top.length) return null
  return (
    <div className="flex-1 min-w-48">
      <p className="text-xs font-medium text-gray-500 mb-1 truncate">{title}</p>
      <Plot
        data={[{
          x: top.map(c => c.null_pct),
          y: top.map(c => c.column),
          type: 'bar',
          orientation: 'h',
          marker: { color: '#0d9488' },
          text: top.map(c => `${c.null_pct}%`),
          textposition: 'outside',
        }]}
        layout={{
          template: 'plotly_white',
          autosize: true,
          margin: { t: 5, r: 50, b: 30, l: 160 },
          xaxis: { title: '% null', range: [0, 110] },
          yaxis: { autorange: 'reversed' },
        }}
        useResizeHandler
        style={{ width: '100%', height: '260px' }}
        config={{ displaylogo: false, displayModeBar: false }}
      />
    </div>
  )
}

function ValueHistogram({ title, bins }) {
  if (!bins?.length) return null
  return (
    <div className="flex-1 min-w-48">
      <p className="text-xs font-medium text-gray-500 mb-1 truncate">{title}</p>
      <Plot
        data={[{
          x: bins.map(b => (b.bin_start + b.bin_end) / 2),
          y: bins.map(b => b.count),
          type: 'bar',
          marker: { color: '#0f766e' },
          width: bins.map(b => b.bin_end - b.bin_start),
        }]}
        layout={{
          template: 'plotly_white',
          autosize: true,
          margin: { t: 5, r: 10, b: 35, l: 50 },
          xaxis: { title: 'log₁₀(VALUE)' },
          yaxis: { title: 'count' },
          bargap: 0.02,
        }}
        useResizeHandler
        style={{ width: '100%', height: '220px' }}
        config={{ displaylogo: false, displayModeBar: false }}
      />
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

function uniquePerYearTraces(uniqueByDs, metric) {
  if (!uniqueByDs) return []
  return DATASETS.map(ds => {
    const rows = (uniqueByDs[ds] ?? []).slice().sort((a, b) => a.year - b.year)
    return {
      x: rows.map(r => r.year),
      y: rows.map(r => r[metric]),
      name: ds,
      type: 'scatter',
      mode: 'lines',
      line: { width: 1.5 },
    }
  })
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

  const recTraces = useMemo(() => {
    if (!recRows.length) return []
    return DATASETS.map(ds => {
      const rows = recRows.filter(r => r.dataset === ds).sort((a, b) => a.year - b.year)
      return { x: rows.map(r => r.year), y: rows.map(r => r.count), name: ds,
               type: 'scatter', mode: 'lines', line: { width: 1.5 } }
    })
  }, [recRows])

  const countryTraces = useMemo(() => uniquePerYearTraces(uniqYr, 'n_countries'), [uniqYr])
  const speciesTraces = useMemo(() => uniquePerYearTraces(uniqYr, 'n_species'),   [uniqYr])

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
        <Plot
          data={recTraces}
          layout={{
            template: 'plotly_white',
            autosize: true,
            margin: { t: 10, r: 10, b: 50, l: 60 },
            xaxis: { title: 'Year' },
            yaxis: { title: 'Records' },
            legend: { orientation: 'h', y: -0.2 },
          }}
          useResizeHandler
          style={{ width: '100%', height: '360px' }}
          config={{ responsive: true, displaylogo: false }}
        />
      </ChartCard>

      <ChartCard title="Unique countries reporting per year, by dataset">
        <Plot
          data={countryTraces}
          layout={{
            template: 'plotly_white',
            autosize: true,
            margin: { t: 10, r: 10, b: 50, l: 60 },
            xaxis: { title: 'Year' },
            yaxis: { title: 'Countries' },
            legend: { orientation: 'h', y: -0.2 },
          }}
          useResizeHandler
          style={{ width: '100%', height: '320px' }}
          config={{ responsive: true, displaylogo: false }}
        />
      </ChartCard>

      <ChartCard title="Unique species reporting per year, by dataset">
        <Plot
          data={speciesTraces}
          layout={{
            template: 'plotly_white',
            autosize: true,
            margin: { t: 10, r: 10, b: 50, l: 60 },
            xaxis: { title: 'Year' },
            yaxis: { title: 'Species' },
            legend: { orientation: 'h', y: -0.2 },
          }}
          useResizeHandler
          style={{ width: '100%', height: '320px' }}
          config={{ responsive: true, displaylogo: false }}
        />
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
        <Plot
          data={[{
            x: (scatter ?? []).map(d => d.qty),
            y: (scatter ?? []).map(d => d.value),
            text: (scatter ?? []).map(d => `${d.country} ${d.year}`),
            type: 'scattergl',
            mode: 'markers',
            marker: { size: 5, color: '#0d9488', opacity: 0.5 },
            hoverinfo: 'text+x+y',
          }]}
          layout={{
            template: 'plotly_white',
            autosize: true,
            margin: { t: 10, r: 10, b: 60, l: 70 },
            xaxis: { title: 'Quantity (tonnes)', type: 'log' },
            yaxis: { title: 'Value (USD)',       type: 'log' },
          }}
          useResizeHandler
          style={{ width: '100%', height: '460px' }}
          config={{ responsive: true, displaylogo: false }}
        />
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
