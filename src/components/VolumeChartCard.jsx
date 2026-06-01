import { useState } from 'react'
import ChartCard from './ChartCard'
import Dropdown from './controls/Dropdown'
import { VOL_UNITS, volMeta } from '../lib/volumeUnits'

/**
 * Plain (non-time-filtered) ChartCard with a Million-tonnes ↔ Billion-lbs unit
 * toggle in the controls slot — for static charts like the Top-N production
 * bars that compare a single period rather than scrub a year range.
 *
 * The render-prop is called with `(factor, volLabel)` so the chart converts its
 * own tonnage data and labels its own axis. Pass `controls` for additional
 * controls (e.g. a period/Top-N dropdown) rendered before the unit toggle.
 */
export default function VolumeChartCard({ title, subtitle, controls, children }) {
  const [unit, setUnit] = useState('mt')
  const { factor, volLabel } = volMeta(unit)

  return (
    <ChartCard
      title={title}
      subtitle={subtitle}
      controls={
        <>
          {controls}
          <Dropdown label="Unit" options={VOL_UNITS} value={unit} onChange={setUnit} />
        </>
      }
    >
      {children(factor, volLabel)}
    </ChartCard>
  )
}
