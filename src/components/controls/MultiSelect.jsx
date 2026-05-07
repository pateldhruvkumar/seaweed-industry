/**
 * Multi-select listbox. Same visual language as Dropdown but tall and
 * scrollable — used for picking N countries / species at once.
 */
export default function MultiSelect({ label, options, value, onChange }) {
  return (
    <label className="flex items-start gap-2">
      {label && (
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap mt-1.5">
          {label}
        </span>
      )}
      <select
        multiple
        value={value}
        onChange={e =>
          onChange([...e.target.selectedOptions].map(o => o.value))
        }
        className="
          bg-white border border-slate-200 rounded-md
          px-2 py-1 text-sm text-slate-700 font-medium
          shadow-sm
          focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
          transition-colors
          h-28 min-w-44
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
