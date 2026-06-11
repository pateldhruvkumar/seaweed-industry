import LineChart from '../charts/LineChart'
import BarChart from '../charts/BarChart'
import DonutChart from '../charts/DonutChart'
import ScatterChart from '../charts/ScatterChart'
import { PLOT_COLORS } from '../../lib/chartTheme'

const HEIGHT = 240
const MAX_SERIES = 8
const MAX_BARS = 15
const MAX_SLICES = 8

function Card({ children }) {
  return (
    <div className="mt-2 rounded-xl border border-gray-200 bg-white shadow-card p-2">
      {children}
    </div>
  )
}

function topSeriesRows(data, spec) {
  if (!spec.series) return data
  const totals = {}
  for (const r of data) {
    const k = String(r[spec.series])
    totals[k] = (totals[k] || 0) + (Number(r[spec.y]) || 0)
  }
  const keep = new Set(
    Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_SERIES)
      .map(e => e[0]),
  )
  return data.filter(r => keep.has(String(r[spec.series])))
}

export default function ChatChart({ data, spec }) {
  if (!spec || !Array.isArray(data) || data.length === 0) return null

  if (spec.kind === 'line') {
    return (
      <Card>
        <LineChart
          data={topSeriesRows(data, spec)}
          xKey={spec.x}
          yKey={spec.y}
          groupKey={spec.series || undefined}
          height={HEIGHT}
        />
      </Card>
    )
  }

  if (spec.kind === 'bar') {
    const rows = [...data]
      .filter(r => r[spec.y] != null && !Number.isNaN(Number(r[spec.y])))
      .sort((a, b) => Math.abs(Number(b[spec.y])) - Math.abs(Number(a[spec.y])))
      .slice(0, MAX_BARS)
    return (
      <Card>
        <BarChart data={rows} labelKey={spec.x} valueKey={spec.y} height={HEIGHT} />
      </Card>
    )
  }

  if (spec.kind === 'donut') {
    const rows = data
      .map(r => ({ label: String(r[spec.x]), value: Number(r[spec.y]) }))
      .filter(r => Number.isFinite(r.value))
      .sort((a, b) => b.value - a.value)
      .slice(0, MAX_SLICES)
    return (
      <Card>
        <DonutChart data={rows} colors={PLOT_COLORS} height={HEIGHT} />
      </Card>
    )
  }

  if (spec.kind === 'scatter') {
    return (
      <Card>
        <ScatterChart
          data={data}
          xKey={spec.x}
          yKey={spec.y}
          labelKey={spec.series || spec.x}
          height={HEIGHT}
        />
      </Card>
    )
  }

  return null
}
