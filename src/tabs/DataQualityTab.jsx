import { useMemo } from 'react'
import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import DataTable from '../components/DataTable'
import Plot from '../lib/Plot'

const DATASETS = ['global_production', 'aquaculture_quantity', 'aquaculture_value', 'capture_quantity']

function SmallBar({ title, records }) {
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

function SmallHist({ title, bins }) {
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
          margin: { t: 5, r: 10, b: 30, l: 50 },
          xaxis: { title: 'log₁₀(VALUE)' },
          yaxis: { title: 'records' },
        }}
        useResizeHandler
        style={{ width: '100%', height: '200px' }}
        config={{ displaylogo: false, displayModeBar: false }}
      />
    </div>
  )
}

const QUALITY_COLS = [
  { key: 'dataset',           label: 'Dataset' },
  { key: 'rows',              label: 'Rows',             format: v => v?.toLocaleString() },
  { key: 'null_cells_total',  label: 'Null cells',       format: v => v?.toLocaleString() },
  { key: 'rows_with_any_null',label: 'Rows w/ nulls',    format: v => v?.toLocaleString() },
  { key: 'value_zeros',       label: 'VALUE = 0',        format: v => v?.toLocaleString() },
  { key: 'value_nulls',       label: 'VALUE nulls',      format: v => v?.toLocaleString() },
  { key: 'duplicate_rows',    label: 'Duplicates',       format: v => v?.toLocaleString() },
]

export default function DataQualityTab() {
  const { data: recData,  loading: l1 } = useData('records_per_year.json')
  const { data: statusData, loading: l2 } = useData('status_distribution.json')
  const { data: valDistData, loading: l3 } = useData('value_distribution.json')

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

  if (l1 || l2 || l3) return <div className="p-12 text-center text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      <ChartCard title="Data quality flag distribution per dataset (% of records)">
        <div className="flex flex-wrap gap-4">
          {DATASETS.map(ds => (
            <SmallBar key={ds} title={ds} records={statusData?.[ds]} />
          ))}
        </div>
      </ChartCard>

      <ChartCard title="VALUE distribution on log₁₀ scale (non-zero records)">
        <div className="flex flex-wrap gap-4">
          {DATASETS.map(ds => (
            <SmallHist key={ds} title={ds} bins={valDistData?.[ds]} />
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

      <ChartCard title="Data quality summary">
        <DataTable columns={QUALITY_COLS} data={qualityTableData} />
      </ChartCard>
    </div>
  )
}
