import AssistantMessage from './AssistantMessage'
import UserMessage from './UserMessage'

export default function MessageBubble({
  role,
  content,
  targetContent,
  sql,
  data,
  type,
  chart,
  suggestions,
  streaming,
  onRegenerate,
  onSuggestion,
  onEdit,
}) {
  if (role === 'user') {
    return <UserMessage content={content} onEdit={onEdit} />
  }

  if (type === 'error') {
    return (
      <div
        className="animate-fade-in rounded-lg border border-rose-200 bg-rose-50
                   text-rose-800 text-sm px-3 py-2"
      >
        {content || targetContent}
      </div>
    )
  }

  return (
    <AssistantMessage
      content={content}
      targetContent={targetContent}
      sql={sql}
      data={data}
      type={type}
      chart={chart}
      suggestions={suggestions}
      streaming={streaming}
      onRegenerate={onRegenerate}
      onSuggestion={onSuggestion}
    />
  )
}
