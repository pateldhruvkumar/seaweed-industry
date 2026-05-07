import {
  IconActivity,
  IconGlobe,
  IconMap,
  IconLeaf,
  IconDollar,
  IconShieldCheck,
  IconWaves,
  IconChevronRight,
  IconExternal,
  IconReport,
} from '../../lib/icons'

/**
 * Vertical primary navigation. Lives at the left edge of the page on
 * desktop, hidden on small screens. Inspired by SaaS analytics dashboards
 * (Droitdash / Linear / Vercel) — section labels above grouped items, an
 * active pill state, and an "info" card pinned to the bottom.
 */

const NAV_GROUPS = [
  {
    label: 'Dashboard',
    items: [{ id: 'overview', label: 'Overview', Icon: IconActivity }],
  },
  {
    label: 'Geography',
    items: [
      { id: 'countries', label: 'Countries', Icon: IconGlobe },
      { id: 'regions', label: 'Regions', Icon: IconMap },
    ],
  },
  {
    label: 'Production',
    items: [
      { id: 'species', label: 'Species & Aquaculture', Icon: IconLeaf },
      { id: 'economics', label: 'Economics', Icon: IconDollar },
    ],
  },
  {
    label: 'Operations',
    items: [{ id: 'quality', label: 'Data Quality', Icon: IconShieldCheck }],
  },
  {
    label: 'Briefings',
    items: [{ id: 'psia', label: 'PSIA Briefing', Icon: IconReport }],
  },
]

export default function Sidebar({ active, onChange }) {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 bg-slate-900 text-slate-200 flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 pt-6 pb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 ring-1 ring-brand-400/30 grid place-items-center">
          <IconWaves className="w-5 h-5 text-brand-300" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white tracking-tight">
            Seaweed Industry
          </p>
          <p className="text-[11px] text-slate-400">Global dashboard</p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-6 no-scrollbar">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 px-3 mb-2">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ id, label, Icon }) => {
                const isActive = active === id
                return (
                  <li key={id}>
                    <button
                      onClick={() => onChange(id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`
                        w-full group flex items-center gap-3 px-3 py-2 rounded-lg
                        text-sm font-medium transition-colors
                        ${
                          isActive
                            ? 'bg-brand-500/15 text-white ring-1 ring-brand-400/20'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }
                      `}
                    >
                      {/* Status dot */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isActive ? 'bg-brand-300' : 'bg-slate-600 group-hover:bg-slate-400'
                        }`}
                      />
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-brand-300' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{label}</span>
                      {isActive && (
                        <IconChevronRight className="w-3.5 h-3.5 ml-auto text-brand-300" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom info card */}
      <div className="p-3">
        <a
          href="https://www.fao.org/fishery/en/statistics"
          target="_blank"
          rel="noreferrer"
          className="block bg-slate-800/60 hover:bg-slate-800 ring-1 ring-slate-700/60 rounded-xl p-4 transition-colors group"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-500/15 ring-1 ring-brand-400/20 grid place-items-center shrink-0">
              <IconWaves className="w-4 h-4 text-brand-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <p className="text-sm font-semibold text-white">FAO FishStat</p>
                <IconExternal className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-300 transition-colors" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                Source · 1950 – 2024
              </p>
            </div>
          </div>
        </a>
      </div>
    </aside>
  )
}
