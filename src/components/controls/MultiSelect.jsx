import { useEffect, useMemo, useRef, useState } from 'react'
import { IconChevronDown } from '../../lib/icons'

/**
 * Modern multi-select dropdown.
 *
 * Replaces the previous native <select multiple>, which always exposed
 * the OS listbox UI (always-open list, ctrl/cmd-click to multi-pick) —
 * a pattern that's awkward and looks dated next to the rest of the
 * dashboard chrome.
 *
 * UX:
 *   - Click trigger to open a panel beneath
 *   - Selected items render as chips inside the trigger; click a chip's
 *     × to remove it
 *   - When more than CHIP_LIMIT are selected, overflow shows as "+N more"
 *   - Search box at the top of the panel filters options
 *   - Each option has a brand-colored checkbox; click to toggle
 *   - "Clear all" link at the bottom when ≥1 selected
 *   - Click outside or ESC to close
 *
 * Props match the previous component exactly so existing call sites
 * (CountriesTab) need no changes:
 *   label       – uppercase caption left of the trigger
 *   options     – array of strings OR { value, label } objects
 *   value       – array of currently-selected values
 *   onChange    – fn(newSelectedArray)
 *   placeholder – shown when nothing selected (default 'Select…')
 */

const CHIP_LIMIT = 3 // when more than this are selected, collapse to "+N more"

export default function MultiSelect({
  label,
  options = [],
  value = [],
  onChange,
  placeholder = 'Select…',
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef(null)
  const searchRef = useRef(null)

  // Normalize options so the rest of the component can treat plain strings
  // and {value,label} objects identically.
  const normalized = useMemo(
    () =>
      options.map(opt =>
        opt && typeof opt === 'object'
          ? { value: opt.value, label: opt.label ?? opt.value }
          : { value: opt, label: String(opt) },
      ),
    [options],
  )

  const byValue = useMemo(() => {
    const m = new Map()
    normalized.forEach(o => m.set(o.value, o))
    return m
  }, [normalized])

  const selected = useMemo(
    () => value.map(v => byValue.get(v)).filter(Boolean),
    [value, byValue],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return normalized
    return normalized.filter(o => o.label.toLowerCase().includes(q))
  }, [normalized, search])

  // Close on outside click or ESC.
  useEffect(() => {
    if (!open) return
    function onMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Auto-focus the search box when opening.
  useEffect(() => {
    if (open) searchRef.current?.focus()
  }, [open])

  const isSelected = v => value.includes(v)
  const toggle = v =>
    onChange(isSelected(v) ? value.filter(x => x !== v) : [...value, v])
  const clearAll = () => onChange([])

  const visibleChips =
    selected.length <= CHIP_LIMIT ? selected : selected.slice(0, CHIP_LIMIT - 1)
  const overflow = selected.length - visibleChips.length

  return (
    <div ref={containerRef} className="flex items-center gap-2">
      {label && (
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">
          {label}
        </span>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`
            flex items-center gap-2 bg-white border rounded-md
            pl-2 pr-2 py-1.5 text-sm shadow-sm
            transition-colors min-w-[12rem] max-w-md
            ${
              open
                ? 'border-brand-500 ring-2 ring-brand-500/30'
                : 'border-slate-200 hover:border-slate-300'
            }
          `}
        >
          <div className="flex flex-wrap items-center gap-1 flex-1 text-left min-w-0">
            {selected.length === 0 && (
              <span className="text-slate-400">{placeholder}</span>
            )}
            {visibleChips.map(opt => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-0.5 pl-1.5 pr-0.5 py-0.5 rounded bg-brand-50 text-brand-700 text-xs font-medium max-w-[10rem]"
              >
                <span className="truncate">{opt.label}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={e => {
                    e.stopPropagation()
                    toggle(opt.value)
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      toggle(opt.value)
                    }
                  }}
                  className="hover:bg-brand-100 rounded px-1 leading-none cursor-pointer"
                  aria-label={`Remove ${opt.label}`}
                >
                  ×
                </span>
              </span>
            ))}
            {overflow > 0 && (
              <span className="text-xs text-slate-500 font-medium px-1">
                +{overflow} more
              </span>
            )}
          </div>
          <IconChevronDown
            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        {open && (
          <div className="absolute z-30 left-0 mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-fade-in">
            <div className="p-2 border-b border-slate-100">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full px-2 py-1.5 text-sm rounded-md border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 placeholder:text-slate-400"
              />
            </div>
            <ul
              role="listbox"
              aria-multiselectable="true"
              className="max-h-64 overflow-y-auto py-1"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-slate-400">
                  No matches
                </li>
              ) : (
                filtered.map(opt => {
                  const sel = isSelected(opt.value)
                  return (
                    <li key={opt.value} role="option" aria-selected={sel}>
                      <button
                        type="button"
                        onClick={() => toggle(opt.value)}
                        className={`
                          w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left
                          transition-colors
                          ${
                            sel
                              ? 'bg-brand-50/70 text-brand-800'
                              : 'hover:bg-slate-50 text-slate-700'
                          }
                        `}
                      >
                        <span
                          className={`
                            shrink-0 w-4 h-4 rounded border grid place-items-center
                            transition-colors
                            ${
                              sel
                                ? 'bg-brand-600 border-brand-600'
                                : 'border-slate-300 bg-white'
                            }
                          `}
                          aria-hidden="true"
                        >
                          {sel && (
                            <svg
                              viewBox="0 0 16 16"
                              className="w-3 h-3 text-white"
                              fill="currentColor"
                            >
                              <path d="M6 11L3 8l1-1 2 2 5-5 1 1z" />
                            </svg>
                          )}
                        </span>
                        <span className="truncate">{opt.label}</span>
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
            {selected.length > 0 && (
              <div className="border-t border-slate-100 px-3 py-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {selected.length} selected
                </span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-brand-700 hover:text-brand-800 font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
