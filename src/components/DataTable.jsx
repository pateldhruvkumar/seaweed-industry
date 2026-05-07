import { useState } from 'react'

export default function DataTable({ columns, data }) {
  const [sortKey, setSortKey] = useState(columns[0].key)
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage]       = useState(0)
  const PAGE = 15

  const sorted = [...(data ?? [])].sort((a, b) => {
    const va = a[sortKey], vb = b[sortKey]
    if (va == null) return 1
    if (vb == null) return -1
    return sortDir === 'asc' ? va - vb : vb - va
  })
  const paged = sorted.slice(page * PAGE, (page + 1) * PAGE)

  const toggle = key => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gray-50">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggle(col.key)}
                  className="px-4 py-2.5 font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap border-b border-gray-100"
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1 text-teal-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-2 text-gray-800">
                    {col.format ? col.format(row[col.key]) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-2 px-1 text-xs text-gray-400">
        <span>{(data ?? []).length} rows</span>
        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="px-2 py-1 border rounded disabled:opacity-30 hover:bg-gray-50"
          >Prev</button>
          <span className="px-2 py-1">Page {page + 1}</span>
          <button
            disabled={(page + 1) * PAGE >= sorted.length}
            onClick={() => setPage(p => p + 1)}
            className="px-2 py-1 border rounded disabled:opacity-30 hover:bg-gray-50"
          >Next</button>
        </div>
      </div>
    </div>
  )
}
