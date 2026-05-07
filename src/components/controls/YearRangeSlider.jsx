/**
 * Two-handle year selector. By default it renders both range inputs *and*
 * inline numeric readouts. Pass `showLabels={false}` when the calling
 * surface already shows the active range elsewhere (e.g. the Topbar pill).
 *
 * Tone defaults to "light" (white background, dark text). Pass tone="dark"
 * to flip to white text + slate separators for use over a dark surface.
 */
export default function YearRangeSlider({
  min,
  max,
  value,
  onChange,
  showLabels = true,
  tone = 'light',
}) {
  const [lo, hi] = value
  const numClass =
    tone === 'dark'
      ? 'text-white'
      : 'text-slate-700'
  const sepClass =
    tone === 'dark' ? 'text-slate-500' : 'text-slate-300'

  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        value={lo}
        onChange={e => onChange([Math.min(+e.target.value, hi - 1), hi])}
        aria-label="Start year"
        className="w-24 accent-brand-500 cursor-pointer"
      />
      {showLabels && (
        <span
          className={`text-sm font-semibold tabular-nums w-10 text-center ${numClass}`}
        >
          {lo}
        </span>
      )}
      {showLabels && <span className={sepClass}>–</span>}
      <input
        type="range"
        min={min}
        max={max}
        value={hi}
        onChange={e => onChange([lo, Math.max(+e.target.value, lo + 1)])}
        aria-label="End year"
        className="w-24 accent-brand-500 cursor-pointer"
      />
      {showLabels && (
        <span
          className={`text-sm font-semibold tabular-nums w-10 text-center ${numClass}`}
        >
          {hi}
        </span>
      )}
    </div>
  )
}
