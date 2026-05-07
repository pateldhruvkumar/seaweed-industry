import { useYear } from '../../context/YearContext'
import YearRangeSlider from '../controls/YearRangeSlider'
import { IconWaves } from '../../lib/icons'

/**
 * Top-level brand header. Slate-900 background gives the page a strong anchor
 * and lets the teal accent ring + chart traces below feel like accents rather
 * than the primary color. Year range slider lives here because it's a *global*
 * filter — every tab respects it.
 */
export default function Header() {
  const { yearRange, setYearRange } = useYear()

  return (
    <header className="bg-slate-900 text-white shadow-chrome">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* Brand mark + name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 ring-1 ring-brand-400/30 grid place-items-center">
            <IconWaves className="w-5 h-5 text-brand-300" />
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-semibold tracking-tight text-white">
              Global Seaweed Industry
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              FAO FishStat · Aquatic algae statistics · 1950–2024
            </p>
          </div>
        </div>

        {/* Global year filter */}
        <div className="flex items-center gap-3 bg-slate-800/60 ring-1 ring-slate-700/50 rounded-lg pl-3 pr-2 py-2">
          <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-slate-400">
            Year range
          </span>
          <YearRangeSlider
            min={1950}
            max={2024}
            value={yearRange}
            onChange={setYearRange}
          />
        </div>
      </div>
    </header>
  )
}
