import { useState } from 'react'
import { listThreads } from '../../lib/threadStore'
import { IconPlus, IconTrash, IconX } from '../../lib/icons'

function relativeTime(ts) {
  const diff = Date.now() - (ts ?? 0)
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

export default function ThreadHistory({ open, activeId, onSelect, onDelete, onNewChat, onClose }) {
  // Re-render trigger only: the displayed list is read fresh from the store on
  // every render, so bumping this after a delete pulls in the updated list.
  const [, forceRefresh] = useState(0)

  if (!open) return null

  const threads = listThreads()

  function handleDelete(e, id) {
    e.stopPropagation()
    onDelete(id)
    forceRefresh(n => n + 1)
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white/95 backdrop-blur animate-fade-in">
      <div className="flex items-center justify-between px-3 py-2.5 shadow-chrome">
        <span className="text-sm font-semibold text-gray-900">Saved chats</span>
        <button
          type="button"
          aria-label="Close history"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 w-6 h-6 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
        >
          <IconX className="w-4 h-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={onNewChat}
        className="mx-3 mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
      >
        <IconPlus className="w-4 h-4" /> New chat
      </button>

      <ul className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {threads.length === 0 && (
          <li className="text-sm text-gray-400 px-1 py-4 text-center">No saved chats yet.</li>
        )}
        {threads.map(t => (
          <li key={t.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect(t.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') onSelect(t.id)
              }}
              className={`group flex items-center justify-between gap-2 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                t.id === activeId ? 'bg-brand-50 ring-1 ring-brand-200' : ''
              }`}
            >
              <div className="min-w-0">
                <div className="truncate text-sm text-gray-800">{t.title}</div>
                <div className="text-[11px] text-gray-400">{relativeTime(t.updatedAt)}</div>
              </div>
              <button
                type="button"
                aria-label={`Delete ${t.title}`}
                onClick={e => handleDelete(e, t.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 w-6 h-6 inline-flex items-center justify-center rounded-md hover:bg-gray-200"
              >
                <IconTrash className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
