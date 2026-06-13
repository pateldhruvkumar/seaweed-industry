import { useRef, useState } from 'react'

export default function UserMessage({ content, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)
  const savingRef = useRef(false)

  function startEdit() {
    savingRef.current = false
    setDraft(content)
    setEditing(true)
  }

  function cancel() {
    setDraft(content)
    setEditing(false)
  }

  function save() {
    const trimmed = draft.trim()
    if (!trimmed) return
    if (savingRef.current) return
    savingRef.current = true
    setEditing(false)
    onEdit(trimmed)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      save()
    }
    if (e.key === 'Escape') cancel()
  }

  if (editing) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="w-[85%] rounded-2xl border border-brand-300 bg-white shadow-card p-2">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={Math.min(6, Math.max(2, draft.split('\n').length))}
            autoFocus
            className="w-full resize-none bg-transparent text-sm text-gray-900
                       focus:outline-none leading-5 p-1"
          />
          <div className="mt-1 flex items-center justify-end gap-2">
            <span className="mr-auto text-[11px] text-gray-400">
              Enter to resend · Shift+Enter for newline · Esc to cancel
            </span>
            <button
              type="button"
              onClick={cancel}
              className="text-xs px-3 py-1 rounded-md text-gray-500 hover:bg-gray-100
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!draft.trim()}
              className="text-xs px-3 py-1 rounded-md bg-brand-600 text-white hover:bg-brand-700
                         disabled:bg-gray-200 disabled:text-gray-400
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Save & resend
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex flex-col items-end animate-fade-in">
      <div
        className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm
                   text-white bg-gradient-to-b from-brand-600 to-brand-700 shadow-card
                   whitespace-pre-wrap break-words"
      >
        {content}
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={startEdit}
          className="mt-1 text-xs text-gray-400 hover:text-brand-600
                     opacity-0 group-hover:opacity-100 focus-visible:opacity-100
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
                     rounded transition-opacity"
        >
          Edit
        </button>
      )}
    </div>
  )
}
