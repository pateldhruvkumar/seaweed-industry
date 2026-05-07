import { useState, useEffect } from 'react'

const PAGE_SIZE = 15

/**
 * Sortable + paginated table. Numeric columns get tabular figures (via the
 * .num class on every cell, applied globally in index.css), so digits line up
 * vertically the way they should in a real analytics table.
 */
export default function DataTable({ columns, data }) {
  const [sortKey, setSortKey] = useState(columns[0].key)
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(0)

  // Reset to page 0 when the underlying dataset changes (e.g. year filter
  // narrows results); otherwise we'd land on an empty page.
  useEffect(() => {
    setPage(0)
  }, [data])

  const sorted = [...(data ?? [])].sort((a, b) => {
    const va = a[sortKey],
      vb = b[sortKey]
    if (va == null) return 1
    if (vb == null) return -1
    if (typeof va === 'string')
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    return sortDir === 'asc' ? va - vb : vb - va
  })
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))

  const toggle = key => {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200/70">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80">
              {columns.map(col => {
                const isSorted = sortKey === col.key
                return (
                  <th
                    key={col.key}
                    scope="col"
                    onClick={() => toggle(col.key)}
                    className={`
                      px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wider
                      cursor-pointer select-none whitespace-nowrap
                      border-b border-slate-200/70 transition-colors
                      ${
                        isSorted
                          ? 'text-brand-700 bg-brand-50/60'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }
                    `}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <span
                        className={`text-[10px] ${
                          isSorted ? 'text-brand-600' : 'text-slate-300'
                        }`}
                      >
                        {isSorted ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={i}
                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors"
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className="px-4 py-2.5 text-slate-700 whitespace-nowrap"
                  >
                    {row[col.key] == null
                      ? '—'
                      : col.format
                      ? col.format(row[col.key])
                      : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-slate-400"
                >
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-3 px-1 text-xs text-slate-500">
        <span className="font-medium">
          {(data ?? []).length.toLocaleString()} rows
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            Prev
          </button>
          <span className="px-2 font-medium text-slate-600">
            Page {page + 1} / {totalPages}
          </span>
          <button
            disabled={(page + 1) * PAGE_SIZE >= sorted.length}
            onClick={() => setPage(p => p + 1)}
            className="px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
