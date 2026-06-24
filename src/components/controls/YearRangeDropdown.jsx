import { useEffect, useRef, useState } from 'react'
import { SELECT_CLASS } from './Dropdown'

const VISIBLE_ROWS = 5
const ROW_HEIGHT_PX = 32 // h-8 on each option below — keep in sync

/**
 * Single year picker styled like the native selects it replaced. Custom
 * listbox instead of <select> because browsers don't allow capping the
 * native popup's height — we want at most VISIBLE_ROWS years visible,
 * with the rest behind a scroll.
 */
function YearSelect({ ariaLabel, years, value, onChange }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const listRef = useRef(null)

  // Close on outside click or ESC (same pattern as MultiSelect).
  useEffect(() => {
    if (!open) return
    function onMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Scroll the current year into the middle of the visible window on open.
  useEffect(() => {
    if (!open || !listRef.current) return
    const i = years.indexOf(value)
    listRef.current.scrollTop = Math.max(
      0,
      (i - Math.floor(VISIBLE_ROWS / 2)) * ROW_HEIGHT_PX,
    )
  }, [open, years, value])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${SELECT_CLASS} tabular-nums text-left`}
      >
        {value}
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          style={{ maxHeight: VISIBLE_ROWS * ROW_HEIGHT_PX }}
          className="absolute z-30 left-0 mt-1 min-w-full bg-white border border-slate-200 rounded-md shadow-lg overflow-y-auto animate-fade-in"
        >
          {years.map(y => {
            const sel = y === value
            return (
              <li
                key={y}
                role="option"
                aria-selected={sel}
                onClick={() => {
                  onChange(y)
                  setOpen(false)
                }}
                className={`h-8 flex items-center px-2.5 text-sm tabular-nums cursor-pointer transition-colors ${
                  sel
                    ? 'bg-brand-50/70 text-brand-800 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {y}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/**
 * From/To year selector backed by two compact dropdowns. Each side's options
 * are bounded by the other side's current value, so an inverted range
 * (from > to) is impossible to select.
 */
export default function YearRangeDropdown({ min, max, value, onChange }) {
  const [lo, hi] = value
  const years = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)

  return (
    <div className="flex items-center gap-1.5">
      <YearSelect
        ariaLabel="From year"
        years={years(min, hi)}
        value={lo}
        onChange={y => onChange([y, hi])}
      />
      <span className="text-slate-300">–</span>
      <YearSelect
        ariaLabel="To year"
        years={years(lo, max)}
        value={hi}
        onChange={y => onChange([lo, y])}
      />
    </div>
  )
}
