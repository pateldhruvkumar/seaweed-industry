import { Sparkline, IconArrowUp, IconArrowDown } from '../lib/icons'

/**
 * Pastel-tinted KPI tile used at the top of analytical pages.
 *
 * Visual structure:
 *   ┌────────────────────────────────────────────┐
 *   │ Label                          ╲╱╲╱  spark │
 *   │ HEADLINE NUMBER                            │
 *   │ Subtext   [+13.4% ↑]                       │
 *   └────────────────────────────────────────────┘
 *
 * Each variant pairs a faint background tint with a saturated sparkline
 * stroke so the row of tiles reads as a coordinated set rather than four
 * unrelated cards. Variant choices follow a teal → cyan → indigo →
 * emerald sweep that complements the brand palette.
 */
const VARIANTS = {
  teal: {
    bg: 'bg-brand-50',
    border: 'border-brand-100',
    label: 'text-brand-700',
    spark: 'text-brand-500',
    sparkVariant: 'up',
  },
  cyan: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-100',
    label: 'text-cyan-700',
    spark: 'text-cyan-500',
    sparkVariant: 'wave',
  },
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    label: 'text-indigo-700',
    spark: 'text-indigo-500',
    sparkVariant: 'up',
  },
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    label: 'text-emerald-700',
    spark: 'text-emerald-500',
    sparkVariant: 'wave',
  },
  rose: {
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    label: 'text-rose-700',
    spark: 'text-rose-500',
    sparkVariant: 'up',
  },
  slate: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    label: 'text-slate-700',
    spark: 'text-slate-500',
    sparkVariant: 'wave',
  },
}

export default function KpiCard({
  label,
  value,
  subtext,
  trend,
  variant = 'teal',
}) {
  const v = VARIANTS[variant] ?? VARIANTS.teal
  const trendDir = trend?.dir
  const TrendIcon =
    trendDir === 'up' ? IconArrowUp : trendDir === 'down' ? IconArrowDown : null

  return (
    <article
      className={`relative rounded-2xl border ${v.border} ${v.bg} p-5 overflow-hidden animate-fade-in`}
    >
      {/* Top row: label + decorative sparkline */}
      <header className="flex items-start justify-between gap-4">
        <p className={`text-xs font-semibold ${v.label}`}>{label}</p>
        <Sparkline
          variant={v.sparkVariant}
          className={`w-14 h-7 ${v.spark}`}
        />
      </header>

      {/* Headline number */}
      <p className="mt-2 text-[28px] leading-none font-bold text-slate-900 tabular-nums truncate">
        {value}
      </p>

      {/* Footer: subtext + optional trend pill */}
      <footer className="mt-3 flex items-center gap-2 flex-wrap">
        {subtext && (
          <span className="text-xs text-slate-600">{subtext}</span>
        )}
        {trend && (
          <span
            className={`
              inline-flex items-center gap-0.5 text-[11px] font-semibold
              px-1.5 py-0.5 rounded
              ${
                trendDir === 'up'
                  ? 'bg-emerald-100 text-emerald-700'
                  : trendDir === 'down'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-200 text-slate-700'
              }
            `}
          >
            {TrendIcon && <TrendIcon className="w-3 h-3" />}
            {trend.text}
          </span>
        )}
      </footer>
    </article>
  )
}
