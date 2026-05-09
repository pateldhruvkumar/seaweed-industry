import { useState } from 'react'
import ResultTable from './ResultTable'

export default function MessageBubble({ role, content, sql, data, type }) {
  const [sqlOpen, setSqlOpen] = useState(false)
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-teal-700 text-white'
            : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>

        {!isUser && type === 'table' && data?.length > 0 && (
          <ResultTable data={data} />
        )}

        {!isUser && sql && (
          <div className="mt-2">
            <button
              onClick={() => setSqlOpen(o => !o)}
              className="text-xs text-teal-600 hover:underline"
            >
              {sqlOpen ? '▼ Hide SQL' : '▶ View SQL'}
            </button>
            {sqlOpen && (
              <pre className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                {sql}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
