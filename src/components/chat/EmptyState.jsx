import SparkAvatar from './SparkAvatar'

const SUGGESTIONS = [
  { emoji: '📈', label: 'Top 5 producers in 2022' },
  { emoji: '🌏', label: 'Compare China vs Indonesia' },
  { emoji: '💰', label: 'Aquaculture value trend' },
  { emoji: '📊', label: 'Capture vs farming split' },
]

export default function EmptyState({ onSubmit }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 text-center animate-fade-in">
      <SparkAvatar size={48} withGlow />
      <h2 className="mt-4 text-xl font-semibold text-gray-900">
        How can I help today?
      </h2>
      <p className="mt-1 text-sm text-gray-500 max-w-xs">
        Ask anything about global seaweed production, trade, or trends.
      </p>
      <div className="mt-6 w-full space-y-2">
        {SUGGESTIONS.map(s => (
          <button
            key={s.label}
            type="button"
            onClick={() => onSubmit(s.label)}
            className="w-full text-left rounded-xl border border-gray-200 bg-white
                       px-3 py-2 text-sm text-gray-700 shadow-card
                       hover:border-brand-400 hover:bg-brand-50/50
                       transition-colors"
          >
            <span className="mr-2">{s.emoji}</span>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
