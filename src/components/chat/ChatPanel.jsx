import { useState } from 'react'
import MessageThread from './MessageThread'
import ChatInput from './ChatInput'

const API_URL = 'http://localhost:8000/chat'

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(question) {
    const userMsg = { role: 'user', content: question, sql: null, data: [], type: null }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const history = updatedMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, history }),
      })

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

      const { answer, sql, data, type } = await resp.json()
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: answer, sql, data, type },
      ])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Is the backend running?',
          sql: null,
          data: [],
          type: 'error',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full border-l border-gray-200 bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-sm font-semibold text-gray-700">Ask your data</span>
        <button
          aria-label="close"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ✕
        </button>
      </div>
      <MessageThread messages={messages} loading={loading} />
      <ChatInput onSubmit={handleSubmit} loading={loading} />
    </div>
  )
}
