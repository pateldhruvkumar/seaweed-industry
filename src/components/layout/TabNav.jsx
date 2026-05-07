const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'countries', label: 'Countries' },
  { id: 'regions',   label: 'Regions' },
  { id: 'species',   label: 'Species & Aquaculture' },
  { id: 'economics', label: 'Economics' },
  { id: 'quality',   label: 'Data Quality' },
]

export default function TabNav({ active, onChange }) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 sticky top-0 z-10">
      <div className="flex gap-0 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              active === tab.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
