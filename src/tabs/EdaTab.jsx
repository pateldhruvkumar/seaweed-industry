import ChartCard from '../components/ChartCard'

const DATASETS = ['global_production', 'aquaculture_quantity', 'aquaculture_value', 'capture_quantity']

export default function EdaTab() {
  return (
    <div className="space-y-6">
      <ChartCard title="EDA — coming soon">
        <p className="text-sm text-slate-500">
          Sections will be added in subsequent tasks. Datasets in scope: {DATASETS.join(', ')}.
        </p>
      </ChartCard>
    </div>
  )
}
