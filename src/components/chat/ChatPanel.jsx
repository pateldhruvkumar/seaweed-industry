import { useEffect, useRef, useState } from 'react'
import ChatHeader from './ChatHeader'
import MessageThread from './MessageThread'
import ChatInput from './ChatInput'

const API_URL = 'http://localhost:8000/chat'

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef(null)

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  function makeUserMsg(text) {
    return { role: 'user', content: text, sql: null, data: [], type: null }
  }

  async function runQuery(question, nextHistory) {
    setMessages(nextHistory)
    setLoading(true)

    if (abortRef.current) abortRef.current.abort()
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

      const { answer, sql, data, type, chart, suggestions } = await resp.json()
      if (controller.signal.aborted) return
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '',
          targetContent: answer,
          sql,
          data,
          type,
          chart,
          suggestions,
          streaming: true,
        },
      ])
    } catch (err) {
      if (err.name !== 'AbortError' && !controller.signal.aborted) {
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
      // Only the request that still owns abortRef may clear the shared state;
      // an aborted predecessor must not clobber its successor's loading/stop.
      if (abortRef.current === controller) {
        setLoading(false)
        abortRef.current = null
      }
    }
  }

  function sendMessage(question, replaceLastAssistant = false) {
    const baseHistory = replaceLastAssistant
      ? messages.slice(0, -1)
      : messages
    const nextHistory = replaceLastAssistant
      ? baseHistory
      : [...baseHistory, makeUserMsg(question)]
    return runQuery(question, nextHistory)
  }

  function editMessage(index, newText) {
    const nextHistory = [...messages.slice(0, index), makeUserMsg(newText)]
    return runQuery(newText, nextHistory)
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
        loading={loading}
        onSuggestion={sendMessage}
        onRegenerate={handleRegenerate}
        onEdit={editMessage}
      />
      <ChatInput
        onSubmit={sendMessage}
        onStop={handleStop}
        loading={loading}
      />
    </div>
  )
}
