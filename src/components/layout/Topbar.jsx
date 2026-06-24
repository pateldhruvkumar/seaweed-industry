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
 *   actions  – optional right-aligned slot (e.g. export menu)
 */
export default function Topbar({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      {/* Page title */}
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
