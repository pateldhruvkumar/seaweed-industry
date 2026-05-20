export default function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="Assistant is typing">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          data-dot
          className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-typing-dot"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  )
}
