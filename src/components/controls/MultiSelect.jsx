export default function MultiSelect({ label, options, value, onChange }) {
  return (
    <div className="flex items-start gap-1.5">
      {label && <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">{label}</span>}
      <select
        multiple
        value={value}
        onChange={e => onChange([...e.target.selectedOptions].map(o => o.value))}
        className="border border-gray-200 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 h-24 min-w-40"
      >
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
        ))}
      </select>
    </div>
  )
}
