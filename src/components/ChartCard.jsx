/**
 * Card wrapper for every chart on the dashboard.
 *
 * Visual structure:
 *   ┌──────────────────────────────────────────────┐
 *   │ ▌ Title                              [ctrl]  │  ← header band
 *   ├──────────────────────────────────────────────┤
 *   │                                              │
 *   │   <chart / table>                            │  ← body
 *   │                                              │
 *   └──────────────────────────────────────────────┘
 *
 * The thin gradient bar (▌) at the start of the title is the brand accent
 * — it gives every card a consistent visual anchor without leaning on heavy
 * borders or backgrounds.
 */
export default function ChartCard({ title, subtitle, controls, children }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200/70 shadow-card overflow-hidden animate-fade-in">
      <header className="px-5 py-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="w-1 self-stretch rounded-full bg-gradient-to-b from-brand-300 to-brand-600 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-800 leading-snug">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {controls && (
          <div className="flex flex-wrap gap-2 items-center shrink-0">
            {controls}
          </div>
        )}
      </header>

      <div className="p-5">{children}</div>
    </section>
  )
}
