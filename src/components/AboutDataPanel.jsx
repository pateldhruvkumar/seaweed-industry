import { useState } from 'react'
import { IconChevronDown, IconExternal, IconReport } from '../lib/icons'

/**
 * Collapsible "About the data" panel rendered at the very top of a tab.
 *
 * Answers the sponsor's first question — "where do these numbers come from?" —
 * before any chart is shown. Collapsed by default so it doesn't crowd the page:
 * the closed state is a single bar (kicker + one-line summary + chevron); the
 * open state lists each dataset with provider, years, an external link and an
 * optional caveat.
 *
 * Collapse mechanics mirror controls/MultiSelect.jsx (useState + aria-expanded +
 * chevron rotate-180 + animate-fade-in); link/caveat styling mirrors SourceNote.
 *
 * Props:
 *   summary   – one plain-language line shown in the collapsed bar
 *   datasets  – array of { name, provider, years, href?, caveat? }
 */
export default function AboutDataPanel({ summary, datasets = [] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
      >
        <IconReport className="w-4 h-4 text-brand-600 shrink-0" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700 shrink-0">
          Data &amp; sources
        </span>
        <span className="text-sm text-slate-500 truncate flex-1 min-w-0">
          {summary}
        </span>
        <IconChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4 animate-fade-in">
          <ul className="space-y-3">
            {datasets.map((d, i) => (
              <li
                key={i}
                className="text-sm text-slate-700 leading-snug"
              >
                <span className="font-medium text-slate-900">{d.name}</span>
                {d.href && (
                  <a
                    href={d.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 ml-1.5 text-brand-600 hover:text-brand-700 align-middle"
                  >
                    link
                    <IconExternal className="w-3 h-3" />
                  </a>
                )}
                <span className="block text-[12px] text-slate-500 mt-0.5">
                  {d.provider}
                  {d.years && <span className="text-slate-400"> · {d.years}</span>}
                </span>
                {d.caveat && (
                  <span className="block italic text-[12px] text-amber-600 mt-0.5">
                    {d.caveat}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
