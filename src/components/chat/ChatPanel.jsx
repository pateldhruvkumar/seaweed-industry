import { useEffect, useRef, useState } from 'react'
import ChatHeader from './ChatHeader'
import MessageThread from './MessageThread'
import ChatInput from './ChatInput'
import ThreadHistory from './ThreadHistory'
import { listThreads, getThread, saveThread, deleteThread } from '../../lib/threadStore'

const API_URL = 'http://localhost:8000/chat'
const SAVE_DEBOUNCE_MS = 500

export default function ChatPanel({ onClose }) {
  // Hydrate from the most-recently-updated saved thread (read once on mount via
  // a lazy initializer — avoids a set-state-in-effect mount load).
  const [initialThread] = useState(() => listThreads()[0] ?? null)
  const [messages, setMessages] = useState(initialThread?.messages ?? [])
  const [loading, setLoading] = useState(false)
  const [activeId, setActiveId] = useState(initialThread?.id ?? null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const abortRef = useRef(null)
  // Holds the active thread id for the save effect without making it a dep
  // (assigning the id mid-save must not re-trigger the effect).
  const activeIdRef = useRef(initialThread?.id ?? null)

  // Debounce-persist the active thread whenever the conversation changes.
  useEffect(() => {
    if (messages.length === 0) return
    const handle = setTimeout(() => {
      const saved = saveThread(activeIdRef.current, messages)
      if (saved.id !== activeIdRef.current) {
        activeIdRef.current = saved.id
        setActiveId(saved.id)
      }
    }, SAVE_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [messages])

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

  function handleNewChat() {
    if (abortRef.current) abortRef.current.abort()
    setMessages([])
    setActiveId(null)
    activeIdRef.current = null
    setHistoryOpen(false)
  }

  function handleSelectThread(id) {
    if (abortRef.current) abortRef.current.abort()
    const thread = getThread(id)
    if (!thread) return
    setMessages(thread.messages)
    setActiveId(id)
    activeIdRef.current = id
    setHistoryOpen(false)
  }

  function handleDeleteThread(id) {
    deleteThread(id)
    if (id === activeIdRef.current) {
      setMessages([])
      setActiveId(null)
      activeIdRef.current = null
    }
  }

  return (
    <div className="relative flex flex-col h-full bg-gradient-to-b from-brand-50/40 via-white to-white">
      <ChatHeader onClose={onClose} onHistory={() => setHistoryOpen(true)} />
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
      <ThreadHistory
        open={historyOpen}
        activeId={activeId}
        onSelect={handleSelectThread}
        onDelete={handleDeleteThread}
        onNewChat={handleNewChat}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  )
}
