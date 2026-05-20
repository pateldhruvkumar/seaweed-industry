import { useRef, useState } from 'react'
import ChatHeader from './ChatHeader'
import MessageThread from './MessageThread'
import ChatInput from './ChatInput'

const API_URL = 'http://localhost:8000/chat'

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef(null)

  async function sendMessage(question, replaceLastAssistant = false) {
    const baseHistory = replaceLastAssistant
      ? messages.slice(0, -1)
      : messages

    const userMsg = replaceLastAssistant
      ? null
      : { role: 'user', content: question, sql: null, data: [], type: null }

    const nextHistory = userMsg ? [...baseHistory, userMsg] : baseHistory
    setMessages(nextHistory)
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const history = nextHistory.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, history }),
        signal: controller.signal,
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

      const { answer, sql, data, type } = await resp.json()
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '',
          targetContent: answer,
          sql,
          data,
          type,
          streaming: true,
        },
      ])
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => prev)
      } else {
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
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  function handleStop() {
    if (abortRef.current) abortRef.current.abort()
  }

  function handleRegenerate() {
    const lastUser = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUser) return
    sendMessage(lastUser.content, true)
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-brand-50/40 via-white to-white">
      <ChatHeader onClose={onClose} />
      <MessageThread
        messages={messages}
        onSuggestion={sendMessage}
        onRegenerate={handleRegenerate}
      />
      <ChatInput
        onSubmit={sendMessage}
        onStop={handleStop}
        loading={loading}
      />
    </div>
  )
}
