/**
 * Compact single-select. Designed to nest inside a ChartCard's controls row,
 * so visual weight is intentionally low — refined typography rather than
 * heavy borders.
 */
export default function Dropdown({ label, options, value, onChange }) {
  return (
    <label className="flex items-center gap-2 group">
      {label && (
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">
          {label}
        </span>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="
          appearance-none bg-white
          border border-slate-200 rounded-md
          pl-2.5 pr-7 py-1.5 text-sm font-medium text-slate-700
          shadow-sm hover:border-slate-300 hover:bg-slate-50
          focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
          transition-colors cursor-pointer
          bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2394a3b8%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-no-repeat bg-[position:right_0.5rem_center]
        "
      >
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    </label>
  )
}
