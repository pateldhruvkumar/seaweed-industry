/**
 * Small at-a-glance metric tile. Used in the strip at the top of the
 * Overview tab to anchor the page with concrete numbers before the user
 * drills into charts.
 *
 * Props:
 *   label    – uppercase caption above the number ("Latest year")
 *   value    – the headline figure (string or number, already formatted)
 *   subtext  – small grey line under the value ("2024")
 *   icon     – optional Icon component (from lib/icons)
 *   trend    – optional { dir: 'up' | 'down' | 'flat', text: '+12.4%' } badge
 *   accent   – tailwind color class for the icon background tint
 *              (default 'bg-brand-50 text-brand-600')
 */
export default function KpiCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  accent = 'bg-brand-50 text-brand-600',
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/70 shadow-card p-5 flex items-start gap-4 animate-fade-in">
      {Icon && (
        <div
          className={`w-10 h-10 rounded-lg grid place-items-center shrink-0 ${accent}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="text-2xl font-bold text-slate-900 tabular-nums leading-tight mt-1 truncate">
          {value}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {subtext && (
            <span className="text-xs text-slate-500">{subtext}</span>
          )}
          {trend && (
            <span
              className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                trend.dir === 'up'
                  ? 'bg-emerald-50 text-emerald-700'
                  : trend.dir === 'down'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {trend.dir === 'up' ? '↑ ' : trend.dir === 'down' ? '↓ ' : ''}
              {trend.text}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
