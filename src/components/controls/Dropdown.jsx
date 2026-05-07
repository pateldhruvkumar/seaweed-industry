export default function Dropdown({ label, options, value, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      {label && <span className="text-xs text-gray-500 whitespace-nowrap">{label}</span>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="border border-gray-200 rounded-md px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
    </div>
  )
}
