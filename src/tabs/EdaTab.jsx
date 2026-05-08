import { useData } from '../hooks/useData'
import ChartCard from '../components/ChartCard'
import DataTable from '../components/DataTable'
import Plot from '../lib/Plot'

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

export default function EdaTab() {
  const { data: summary, loading: lSum }  = useData('eda_summary_stats.json')
  const { data: missing, loading: lMiss } = useData('eda_missing_data.json')

  if (lSum || lMiss) return <div className="p-12 text-center text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      <ChartCard title="Dataset summary statistics">
        <DataTable columns={SUMMARY_COLS} data={summary ?? []} />
      </ChartCard>

      <ChartCard title="Missing-data % per column (top 12 columns per dataset)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DATASETS.map(ds => (
            <MissingDataBar key={ds} title={ds} columns={missing?.[ds]} />
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
