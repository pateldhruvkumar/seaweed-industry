/**
 * Right-side "Key Notes" panel used in briefing-style chart panels.
 * Mirrors the PSIA PDF layout: a small uppercase heading, a bullet list,
 * and an optional "Why it matters" callout block at the bottom.
 *
 * Props:
 *   notes    – array of strings (one per bullet)
 *   takeaway – optional string highlighted in a tinted block
 *   heading  – section heading (defaults to "Key Notes")
 */
export default function InsightsList({ notes = [], takeaway, heading = 'Key Notes' }) {
  return (
    <div className="border-l border-slate-200 pl-6 py-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
        {heading}
      </p>
      <div className="h-px w-12 bg-brand-500 mt-1.5 mb-4" />

      <ul className="space-y-3 text-sm text-slate-700 leading-relaxed">
        {notes.map((n, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
            <span>{n}</span>
          </li>
        ))}
      </ul>

      {takeaway && (
        <div className="mt-5 rounded-lg bg-brand-50 border border-brand-100 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-700">
            Why it matters
          </p>
          <p className="text-sm text-slate-700 mt-1 leading-relaxed">
            {takeaway}
          </p>
        </div>
      )}
    </div>
  )
}
