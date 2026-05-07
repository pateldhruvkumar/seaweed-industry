import { IconBell, IconSettings } from '../../lib/icons'

/**
 * Top utility bar inside the main content area.
 *
 * Year-range filtering moved out of the global topbar and onto each
 * individual chart card (see TimeFilteredChartCard). That gives the user
 * independent control per visualization and frees up topbar real estate
 * for the page title.
 *
 * Props:
 *   title    – the active page's headline ("Overview", "Countries", etc.)
 *   subtitle – small caption beneath the title
 */
export default function Topbar({ title, subtitle }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      {/* Page title */}
      <div className="min-w-0">
        <h1 className="text-3xl lg:text-[34px] font-bold text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>

      {/* Right-side utilities */}
      <div className="flex items-center gap-3 flex-wrap">
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
