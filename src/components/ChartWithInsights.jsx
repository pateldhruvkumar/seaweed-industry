import InsightsList from './InsightsList'

/**
 * Two-column briefing panel: chart on the left ~70%, "Key Notes" sidebar
 * on the right ~30%. Direct visual descendant of the PSIA PDF layout.
 *
 * Above the chart, a small "tag pill" identifies which KPI section the
 * panel belongs to (e.g. "KPI 1 · Context") plus a bold panel title.
 *
 * Props:
 *   tag      – short uppercase identifier shown in a pill
 *   title    – panel title
 *   notes    – array of bullets for the right sidebar
 *   takeaway – optional bold callout under the bullets
 *   children – the chart visualization
 */
export default function ChartWithInsights({
  tag,
  title,
  notes,
  takeaway,
  children,
}) {
  return (
    <section className="bg-white rounded-xl border border-slate-200/70 shadow-card overflow-hidden animate-fade-in">
      {/* Header band */}
      <header className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
        {tag && (
          <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-brand-600 text-white rounded-md">
            {tag}
          </span>
        )}
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
      </header>

      {/* Two-column body */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6 p-6">
        <div className="min-w-0">{children}</div>
        <InsightsList notes={notes} takeaway={takeaway} />
      </div>
    </section>
  )
}
