import {
  IconActivity,
  IconGlobe,
  IconMap,
  IconLeaf,
  IconDollar,
} from '../../lib/icons'

const TABS = [
  { id: 'overview',  label: 'Overview',              Icon: IconActivity },
  { id: 'countries', label: 'Countries',             Icon: IconGlobe },
  { id: 'regions',   label: 'Regions',               Icon: IconMap },
  { id: 'species',   label: 'Species & Aquaculture', Icon: IconLeaf },
  { id: 'economics', label: 'Economics',             Icon: IconDollar },
]

/**
 * Sticky pill-bar nav. Each tab pairs an icon with its label, and the active
 * tab gets an underline accent (Linear / Stripe / Vercel pattern) plus a
 * brand-colored icon to reinforce selection at a glance.
 */
export default function TabNav({ active, onChange }) {
  return (
    <nav className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-20 shadow-chrome">
      <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto no-scrollbar">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`
                relative flex items-center gap-2 px-3.5 py-3.5 text-sm font-medium
                whitespace-nowrap transition-colors
                ${
                  isActive
                    ? 'text-brand-700'
                    : 'text-slate-500 hover:text-slate-900'
                }
              `}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-brand-600' : 'text-slate-400'
                }`}
              />
              {label}
              {isActive && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 bg-brand-600 rounded-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
