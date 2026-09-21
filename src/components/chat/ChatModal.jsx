import { useEffect } from 'react'

/**
 * Centered dialog shell for the AI chat. Owns only chrome and dismissal —
 * no chat state — so ChatPanel stays reusable in any container.
 *
 * The backdrop is deliberately transparent-with-blur rather than a dark
 * scrim: the dashboard stays legible behind the conversation.
 */
export default function ChatModal({ open, onClose, children }) {
  // Escape closes, matching the dropdown idiom used elsewhere in the app.
  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  // Stop the dashboard scrolling behind the dialog.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open) return null

  return (
    <div
      data-testid="chat-modal-backdrop"
      // Only a click that lands on the backdrop itself dismisses; clicks inside
      // the dialog bubble up here and must be ignored.
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-md animate-fade-in sm:p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="PSIA AI"
        className="relative flex h-full w-full overflow-hidden bg-white shadow-2xl ring-1 ring-slate-900/5 sm:h-[85vh] sm:max-w-5xl sm:rounded-2xl"
      >
        {children}
      </div>
    </div>
  )
}
