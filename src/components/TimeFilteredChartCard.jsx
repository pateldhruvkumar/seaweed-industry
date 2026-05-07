import { useState } from 'react'
import ChartCard from './ChartCard'
import YearRangeSlider from './controls/YearRangeSlider'

const DEFAULT_MIN = 1950
const DEFAULT_MAX = 2024

/**
 * Chart card that owns its own year-range state and exposes a compact
 * YearRangeSlider in the controls slot.
 *
 * The chart inside derives its filtered data from the `[from, to]` tuple
 * handed back through the children render-prop, so each chart on a page
 * can be scrubbed independently — useful when, say, you want to compare
 * the long-run shape of one series next to the short-run shape of another.
 *
 * Props:
 *   title, subtitle  – passed through to ChartCard
 *   minYear, maxYear – slider bounds (defaults 1950–2024)
 *   initialRange     – starting [from, to] (defaults to full range)
 *   extraControls    – additional controls rendered before the slider
 *   children         – render-prop: ([from, to]) => ReactNode
 */
export default function TimeFilteredChartCard({
  title,
  subtitle,
  minYear = DEFAULT_MIN,
  maxYear = DEFAULT_MAX,
  initialRange,
  extraControls,
  children,
}) {
  const [range, setRange] = useState(initialRange ?? [minYear, maxYear])

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      controls={
        <>
          {extraControls}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md pl-2.5 pr-2 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              Years
            </span>
            <YearRangeSlider
              min={minYear}
              max={maxYear}
              value={range}
              onChange={setRange}
            />
          </div>
        </>
      }
    >
      {children(range)}
    </ChartCard>
  )
}
