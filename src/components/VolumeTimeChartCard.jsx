import { useState } from 'react'
import TimeFilteredChartCard from './TimeFilteredChartCard'
import Dropdown from './controls/Dropdown'
import { VOL_UNITS, volMeta } from '../lib/volumeUnits'

/**
 * TimeFilteredChartCard with its own per-card Million-tonnes ↔ Billion-lbs unit
 * toggle in the controls slot, sitting alongside the year slider.
 *
 * The render-prop is called with `(range, factor, volLabel)` so each chart
 * converts its own tonnage data (`value * factor`) and labels its own axis
 * (`volLabel`). Pass `extraControls` to render additional controls (e.g. a
 * country MultiSelect) before the unit toggle.
 */
export default function VolumeTimeChartCard({
  title,
  subtitle,
  extraControls,
  children,
}) {
  const [unit, setUnit] = useState('mt')
  const { factor, volLabel } = volMeta(unit)

  return (
    <TimeFilteredChartCard
      title={title}
      subtitle={subtitle}
      extraControls={
        <>
          {extraControls}
          <Dropdown label="Unit" options={VOL_UNITS} value={unit} onChange={setUnit} />
        </>
      }
    >
      {range => children(range, factor, volLabel)}
    </TimeFilteredChartCard>
  )
}
