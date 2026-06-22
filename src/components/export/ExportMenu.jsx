import { useState, useRef, useEffect } from 'react'
import { useExport } from '../../hooks/useExport'
import { IconDownload, IconChevronDown } from '../../lib/icons'

// Formats grow per phase: Excel (phase 1), PDF (phase 2), PowerPoint (phase 3).
const FORMATS = [
  { id: 'xlsx', label: 'Excel (.xlsx)' },
]

export default function ExportMenu({ tabId, tabTitle, tabSubtitle }) {
  const [open, setOpen] = useState(false)
  const { exporting, error, run } = useExport({ tabId, tabTitle, tabSubtitle })
  const ref = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  async function handlePick(format) {
    setOpen(false)
    await run(format)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={!!exporting}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
      >
        <IconDownload className="w-4 h-4" />
        {exporting ? 'Exporting…' : 'Export'}
        <IconChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {FORMATS.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => handlePick(f.id)}
              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="absolute right-0 mt-1 whitespace-nowrap text-[11px] text-rose-600"
        >
          {error}
        </p>
      )}
    </div>
  )
}
