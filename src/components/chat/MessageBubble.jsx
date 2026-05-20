import AssistantMessage from './AssistantMessage'

export default function MessageBubble({
  role,
  content,
  targetContent,
  sql,
  data,
  type,
  streaming,
  onRegenerate,
}) {
  if (role === 'user') {
    return (
      <div className="flex justify-end animate-fade-in">
        <div
          className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm
                     text-white bg-gradient-to-b from-brand-600 to-brand-700 shadow-card
                     whitespace-pre-wrap break-words"
        >
          {content}
        </div>
      </div>
    )
  }

  if (type === 'error') {
    return (
      <div
        className="animate-fade-in rounded-lg border border-rose-200 bg-rose-50
                   text-rose-800 text-sm px-3 py-2"
      >
        {content}
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
      streaming={streaming}
      onRegenerate={onRegenerate}
    />
  )
}
