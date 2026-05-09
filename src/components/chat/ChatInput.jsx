import { useState } from 'react'

export default function ChatInput({ onSubmit, loading }) {
  const [value, setValue] = useState('')

  function handleSubmit() {
    const trimmed = value.trim()
    if (trimmed) {
      onSubmit(trimmed)
      setValue('')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-gray-200 p-3">
      <div className="relative">
        <textarea
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm
                     focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50
                     disabled:text-gray-400"
          rows={2}
          placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !value.trim()}
          aria-label="Send"
          className="absolute bottom-2 right-2 flex items-center justify-center w-6 h-6
                     text-teal-600 hover:text-teal-800 disabled:text-gray-300
                     transition-colors"
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
              </svg>
          }
        </button>
      </div>
    </div>
  )
}
