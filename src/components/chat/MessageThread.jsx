import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import EmptyState from './EmptyState'

export default function MessageThread({
  messages,
  onSuggestion,
  onRegenerate,
}) {
  const bottomRef = useRef(null)

  useEffect(() => {
    if (bottomRef.current?.scrollIntoView) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

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
          streaming={!!msg.streaming}
          onRegenerate={i === lastAssistantIdx ? onRegenerate : undefined}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
