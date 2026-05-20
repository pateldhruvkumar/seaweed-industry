import SparkAvatar from './SparkAvatar'

export default function ChatHeader({ onClose }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-white/60 backdrop-blur shadow-chrome">
      <div className="flex items-center gap-2">
        <SparkAvatar size={24} />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-gray-900">PSIA AI</span>
          <span className="text-[11px] text-brand-700">Ask your data</span>
        </div>
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 text-lg leading-none w-6 h-6 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
      >
        ✕
      </button>
    </div>
  )
}
