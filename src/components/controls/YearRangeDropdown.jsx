import { SELECT_CLASS } from './Dropdown'

/**
 * From/To year selector backed by two compact dropdowns. Each side's options
 * are bounded by the other side's current value, so an inverted range
 * (from > to) is impossible to select.
 */
export default function YearRangeDropdown({ min, max, value, onChange }) {
  const [lo, hi] = value
  const years = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={lo}
        onChange={e => onChange([+e.target.value, hi])}
        aria-label="From year"
        className={`${SELECT_CLASS} tabular-nums`}
      >
        {years(min, hi).map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <span className="text-slate-300">–</span>
      <select
        value={hi}
        onChange={e => onChange([lo, +e.target.value])}
        aria-label="To year"
        className={`${SELECT_CLASS} tabular-nums`}
      >
        {years(lo, max).map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}
