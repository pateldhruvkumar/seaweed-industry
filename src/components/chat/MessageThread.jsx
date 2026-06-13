import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import EmptyState from './EmptyState'
import SparkAvatar from './SparkAvatar'
import TypingDots from './TypingDots'

export default function MessageThread({
  messages,
  loading = false,
  onSuggestion,
  onRegenerate,
  onEdit,
}) {
  const bottomRef = useRef(null)

  useEffect(() => {
    if (bottomRef.current?.scrollIntoView) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <EmptyState onSubmit={onSuggestion} />
      </div>
    )
  }

  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].type !== 'error') return i
    }
    return -1
  })()

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
      {messages.map((msg, i) => (
        <MessageBubble
          key={i}
          role={msg.role}
          content={msg.content}
          targetContent={msg.targetContent}
          sql={msg.sql}
          data={msg.data}
          type={msg.type}
          chart={msg.chart}
          suggestions={msg.suggestions}
          streaming={!!msg.streaming}
          onRegenerate={i === lastAssistantIdx ? onRegenerate : undefined}
          onSuggestion={i === lastAssistantIdx ? onSuggestion : undefined}
          onEdit={msg.role === 'user' && onEdit ? text => onEdit(i, text) : undefined}
        />
      ))}
      {loading && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <SparkAvatar size={20} />
            <span className="text-xs font-medium text-gray-500">PSIA AI</span>
          </div>
          <TypingDots />
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
