import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

export default function MessageThread({ messages, loading }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    if (bottomRef.current?.scrollIntoView) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  return (
    <div className="flex-1 overflow-y-auto p-3">
      {messages.length === 0 && !loading && (
        <p className="text-center text-gray-400 text-xs mt-8">
          Ask anything about the seaweed dataset
        </p>
      )}

      {messages.map((msg, i) => (
        <MessageBubble
          key={i}
          role={msg.role}
          content={msg.content}
          sql={msg.sql}
          data={msg.data}
          type={msg.type}
        />
      ))}

      {loading && (
        <div
          data-testid="loading-indicator"
          className="flex justify-start mb-3"
        >
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <span className="text-gray-400 text-sm animate-pulse">···</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
