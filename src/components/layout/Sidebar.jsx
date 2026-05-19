import {
  IconActivity,
  IconGlobe,
  IconMap,
  IconLeaf,
  IconDollar,
  IconSparkles,
  IconWaves,
  IconChevronRight,
  IconExternal,
  IconReport,
} from '../../lib/icons'
import psiaLogo from '../../assets/psia-logo-white-green.png'

/**
 * Vertical primary navigation. Lives at the left edge of the page on
 * desktop (hidden on small screens). Inspired by SaaS analytics dashboards
 * — section labels above grouped items, an active pill state, and an
 * "info" card pinned to the bottom.
 *
 * The "Market & End-Use KPIs" group uses the official KPI names from the
 * stakeholder tracker verbatim, so each entry is much longer than the
 * other nav items. The button styles below allow text to wrap onto two
 * lines for those entries while keeping single-line items unchanged.
 */

const NAV_GROUPS = [
  {
    label: 'Dashboard',
    items: [{ id: 'overview', label: 'Overview', Icon: IconActivity }],
  },
  {
    label: 'Operations',
    items: [
      { id: 'eda', label: 'EDA', Icon: IconSparkles },
    ],
  },
  {
    label: 'Geography',
    items: [
      { id: 'countries', label: 'Countries',         Icon: IconGlobe },
      { id: 'regions',   label: 'Regions',           Icon: IconMap   },
    ],
  },
  {
    label: 'Production',
    items: [
      { id: 'species',   label: 'Species & Aquaculture', Icon: IconLeaf },
      { id: 'economics', label: 'Economics',             Icon: IconDollar },
    ],
  },
  {
    // Names below are the verbatim KPI titles from the Market & End-Use
    // tracker — keep them intact so the dashboard ↔ tracker mapping is
    // unambiguous, even if individual labels are long enough to wrap.
    label: 'Market & End-Use KPIs',
    items: [
      {
        id:    'kpi-export-value',
        label: 'Export Value of Seaweed Products ($/year)',
        Icon:  IconExternal,
      },
      {
        id:    'kpi-price-wet-tonne',
        label: 'Price per Wet Tonne by Species and End Use ($/tonne)',
        Icon:  IconDollar,
      },
      {
        id:    'kpi-value-per-lb',
        label: 'Value of Seaweed ($/lb)',
        Icon:  IconDollar,
      },
      {
        id:    'kpi-wet-vs-processed',
        label: 'Wet vs. Processed Kelp Demand',
        Icon:  IconReport,
      },
      {
        id:    'kpi-gross-output',
        label: 'Gross Value of Seaweed Industry Output ($/year)',
        Icon:  IconActivity,
      },
    ],
  },
]

export default function Sidebar({ active, onChange }) {
  return (
    <aside className="hidden lg:flex w-72 shrink-0 bg-slate-900 text-slate-200 flex-col h-screen sticky top-0">
      {/* Brand */}
      <a
        href="https://seaweedindustry.ca/"
        target="_blank"
        rel="noreferrer"
        className="px-5 pt-6 pb-8 block"
      >
        <img
          src={psiaLogo}
          alt="Pacific Seaweed Industry Association"
          className="w-full h-auto"
        />
        <p className="text-[11px] text-slate-400 mt-2">Global dashboard</p>
      </a>

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
                      title={label}
                      className={`
                        w-full group flex items-start gap-3 px-3 py-2 rounded-lg
                        text-sm font-medium transition-colors text-left
                        ${
                          isActive
                            ? 'bg-brand-500/15 text-white ring-1 ring-brand-400/20'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }
                      `}
                    >
                      {/* Status dot */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 mt-2 ${
                          isActive
                            ? 'bg-brand-300'
                            : 'bg-slate-600 group-hover:bg-slate-400'
                        }`}
                      />
                      <Icon
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isActive ? 'text-brand-300' : 'text-slate-400'
                        }`}
                      />
                      <span className="flex-1 leading-snug break-words">
                        {label}
                      </span>
                      {isActive && (
                        <IconChevronRight className="w-3.5 h-3.5 mt-0.5 text-brand-300 shrink-0" />
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
          href="https://drive.google.com/drive/folders/1onchAmV22tj-26CKrN7LQEKqwx9NcOlx?usp=sharing"
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
                <p className="text-sm font-semibold text-white">PSIA Dataset</p>
                <IconExternal className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-300 transition-colors" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                Source · Google Drive
              </p>
            </div>
          </div>
        </a>
      </div>
    </aside>
  )
}
