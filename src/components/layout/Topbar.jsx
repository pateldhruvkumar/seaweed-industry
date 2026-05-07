import { useYear } from '../../context/YearContext'
import YearRangeSlider from '../controls/YearRangeSlider'
import { IconBell, IconSettings } from '../../lib/icons'

/**
 * Top utility bar inside the main content area. Mirrors the SaaS-dashboard
 * pattern: a big page title on the left, a wide filter widget in the
 * middle-right, and a compact icon stack on the far right with a single
 * dark-themed "primary" button to provide visual rhyme with the sidebar.
 *
 * Props:
 *   title    – the active page's headline ("Overview", "Countries", etc.)
 *   subtitle – small caption beneath the title
 */
export default function Topbar({ title, subtitle }) {
  const { yearRange, setYearRange } = useYear()

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      {/* Page title */}
      <div className="min-w-0">
        <h1 className="text-3xl lg:text-[34px] font-bold text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Right-side utilities */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Wide filter widget — visual analog of the search bar in reference */}
        <div className="bg-white border border-slate-200 rounded-xl pl-4 pr-2 py-2 flex items-center gap-3 shadow-sm">
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-[0.12em] font-semibold text-slate-400">
              Year range
            </span>
            <span className="text-xs text-slate-600 font-medium tabular-nums">
              {yearRange[0]} – {yearRange[1]}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <YearRangeSlider
            min={1950}
            max={2024}
            value={yearRange}
            onChange={setYearRange}
            showLabels={false}
          />
        </div>

        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative w-11 h-11 rounded-xl bg-white border border-slate-200 grid place-items-center text-slate-500 hover:text-slate-800 hover:border-slate-300 shadow-sm transition-colors"
        >
          <IconBell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white" />
        </button>

        {/* Settings — dark accent box */}
        <button
          type="button"
          aria-label="Settings"
          className="w-11 h-11 rounded-xl bg-slate-900 grid place-items-center text-white hover:bg-slate-800 shadow-card transition-colors"
        >
          <IconSettings className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
