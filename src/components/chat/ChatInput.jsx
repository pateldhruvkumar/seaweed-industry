import { useRef, useState, useEffect } from 'react'

const MAX_ROWS = 6
const LINE_HEIGHT_PX = 20

export default function ChatInput({ onSubmit, onStop, loading }) {
  const [value, setValue] = useState('')
  const taRef = useRef(null)

  useEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    const max = LINE_HEIGHT_PX * MAX_ROWS + 16
    el.style.height = Math.min(el.scrollHeight, max) + 'px'
  }, [value])

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || loading) return
    onSubmit(trimmed)
    setValue('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="border-t border-gray-100 bg-gradient-to-b from-white to-brand-50/30 px-3 pt-3 pb-4">
      <div
        className="rounded-2xl border border-gray-200 bg-white shadow-card
                   focus-within:border-brand-400 focus-within:shadow-card-hover
                   focus-within:ring-4 focus-within:ring-brand-100/60
                   transition-all px-3 pt-2.5 pb-2"
      >
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about seaweed data…"
          className="w-full resize-none bg-transparent text-sm text-gray-900
                     placeholder:text-gray-400 focus:outline-none leading-5"
          style={{ minHeight: `${LINE_HEIGHT_PX}px` }}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            Enter to send · Shift+Enter for newline
          </span>
          {loading ? (
            <button
              type="button"
              aria-label="Stop"
              onClick={onStop}
              className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700
                         inline-flex items-center justify-center transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <rect x="6" y="6" width="12" height="12" rx="1.5" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              aria-label="Send"
              onClick={submit}
              disabled={!value.trim()}
              className="w-8 h-8 rounded-lg bg-brand-600 hover:bg-brand-700 text-white
                         disabled:bg-gray-100 disabled:text-gray-300
                         inline-flex items-center justify-center transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-gray-400">
        PSIA AI can make mistakes — verify important data.
      </p>
    </div>
  )
}
