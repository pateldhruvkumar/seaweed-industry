import { useState } from 'react'
import { formatCompact } from '../../utils/formatters'

const PAGE = 10

// Below this magnitude numbers stay unabbreviated, so 4-digit years survive.
const COMPACT_MIN = 10000

// Large numbers get K/M/B; small floats get 2 decimals; integers stay verbatim.
function formatCell(v) {
  if (v == null) return '—'
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (Math.abs(v) >= COMPACT_MIN) return formatCompact(v)
    if (!Number.isInteger(v)) return v.toFixed(2)
  }
  return String(v)
}

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
              {headers.map(h => {
                const formatted = formatCell(row[h])
                const raw = row[h] == null ? null : String(row[h])
                return (
                  <td
                    key={h}
                    className="px-2 py-1 text-gray-700 border-b border-gray-100"
                    title={raw !== null && raw !== formatted ? raw : undefined}
                  >
                    {formatted}
                  </td>
                )
              })}
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
