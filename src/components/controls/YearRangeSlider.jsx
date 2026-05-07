/**
 * Two-handle year selector. Lives inside the dark header, so the colour
 * tokens are tuned for a slate-900 background: white numerics, slate-400
 * separators, brand-400 thumb accent.
 */
export default function YearRangeSlider({ min, max, value, onChange }) {
  const [lo, hi] = value
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        value={lo}
        onChange={e => onChange([Math.min(+e.target.value, hi - 1), hi])}
        aria-label="Start year"
        className="w-24 accent-brand-400 cursor-pointer"
      />
      <span className="text-sm font-semibold text-white tabular-nums w-10 text-center">
        {lo}
      </span>
      <span className="text-slate-500">–</span>
      <input
        type="range"
        min={min}
        max={max}
        value={hi}
        onChange={e => onChange([lo, Math.max(+e.target.value, lo + 1)])}
        aria-label="End year"
        className="w-24 accent-brand-400 cursor-pointer"
      />
      <span className="text-sm font-semibold text-white tabular-nums w-10 text-center">
        {hi}
      </span>
    </div>
  )
}
