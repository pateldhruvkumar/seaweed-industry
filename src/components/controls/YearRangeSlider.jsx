export default function YearRangeSlider({ min, max, value, onChange }) {
  const [lo, hi] = value
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400 uppercase tracking-wide">Year</span>
      <input
        type="range" min={min} max={max} value={lo}
        onChange={e => onChange([Math.min(+e.target.value, hi - 1), hi])}
        className="w-24 accent-teal-600"
      />
      <span className="text-sm font-semibold text-gray-700 w-10 text-center">{lo}</span>
      <span className="text-gray-400">–</span>
      <input
        type="range" min={min} max={max} value={hi}
        onChange={e => onChange([lo, Math.max(+e.target.value, lo + 1)])}
        className="w-24 accent-teal-600"
      />
      <span className="text-sm font-semibold text-gray-700 w-10 text-center">{hi}</span>
    </div>
  )
}
