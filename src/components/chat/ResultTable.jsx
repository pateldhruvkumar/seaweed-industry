import { useState } from 'react'

const PAGE = 10

export default function ResultTable({ data }) {
  const [expanded, setExpanded] = useState(false)

  if (!data || data.length === 0) return null

  const headers = Object.keys(data[0])
  const rows = expanded ? data : data.slice(0, PAGE)

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {headers.map(h => (
              <th key={h} className="px-2 py-1 text-left font-medium text-gray-600 border-b border-gray-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {headers.map(h => (
                <td key={h} className="px-2 py-1 text-gray-700 border-b border-gray-100">
                  {row[h] == null ? '—' : String(row[h])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > PAGE && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-1 text-xs text-teal-600 hover:underline"
        >
          Show all {data.length} rows
        </button>
      )}
    </div>
  )
}
