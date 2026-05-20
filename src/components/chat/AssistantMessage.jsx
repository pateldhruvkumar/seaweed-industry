import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import SparkAvatar from './SparkAvatar'
import TypingDots from './TypingDots'
import ResultTable from './ResultTable'

const CHARS_PER_TICK = 3
const TICK_MS = 18

const MD_COMPONENTS = {
  p: props => <p className="my-2" {...props} />,
  ul: props => <ul className="my-2 list-disc pl-5 space-y-1" {...props} />,
  ol: props => <ol className="my-2 list-decimal pl-5 space-y-1" {...props} />,
  li: props => <li className="leading-relaxed" {...props} />,
  strong: props => <strong className="font-semibold text-gray-900" {...props} />,
  h1: props => <h2 className="mt-3 mb-1 text-base font-semibold text-gray-900" {...props} />,
  h2: props => <h3 className="mt-3 mb-1 text-sm font-semibold text-gray-900" {...props} />,
  code: ({ inline, children, ...props }) =>
    inline
      ? <code className="bg-gray-100 text-gray-800 rounded px-1 py-0.5 text-[0.85em] font-mono" {...props}>{children}</code>
      : <code className="block bg-gray-900 text-gray-100 rounded-lg p-3 text-xs font-mono overflow-x-auto" {...props}>{children}</code>,
  pre: props => <pre className="my-2" {...props} />,
}

export default function AssistantMessage({
  content,
  targetContent,
  sql,
  data,
  type,
  streaming = false,
  onRegenerate,
}) {
  const final = targetContent ?? content ?? ''
  const [revealed, setRevealed] = useState(streaming && targetContent ? '' : final)
  const [done, setDone] = useState(!streaming || !targetContent)
  const [sqlOpen, setSqlOpen] = useState(false)
  const [copyState, setCopyState] = useState('idle')
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!streaming || !targetContent) {
      setRevealed(final)
      setDone(true)
      return
    }
    setRevealed('')
    setDone(false)
    let i = 0
    intervalRef.current = setInterval(() => {
      i = Math.min(i + CHARS_PER_TICK, targetContent.length)
      setRevealed(targetContent.slice(0, i))
      if (i >= targetContent.length) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        setDone(true)
      }
    }, TICK_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [streaming, targetContent, final])

  useEffect(() => {
    if (!streaming || done) return
    function skip() {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setRevealed(targetContent ?? final)
      setDone(true)
    }
    document.addEventListener('mousedown', skip, { once: true })
    return () => document.removeEventListener('mousedown', skip)
  }, [streaming, done, targetContent, final])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(final)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1500)
    } catch {}
  }

  const showTyping = streaming && revealed.length === 0
  const showActions = done && revealed.length > 0

  return (
    <div className="group animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <SparkAvatar size={20} />
        <span className="text-xs font-medium text-gray-500">PSIA AI</span>
      </div>

      <div data-testid="assistant-body" className="text-sm text-gray-800 leading-relaxed">
        {showTyping ? (
          <TypingDots />
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
            {revealed}
          </ReactMarkdown>
        )}
      </div>

      {done && type === 'table' && data?.length > 0 && (
        <div className="mt-2 rounded-xl border border-gray-200 bg-white shadow-card p-2">
          <ResultTable data={data} />
        </div>
      )}

      {done && sql && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setSqlOpen(o => !o)}
            className="inline-flex items-center gap-1 text-xs text-brand-700 hover:bg-brand-50 px-2 py-1 rounded-md"
          >
            <span
              className="inline-block transition-transform"
              style={{ transform: sqlOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >▶</span>
            {sqlOpen ? 'Hide SQL' : 'View SQL'}
          </button>
          {sqlOpen && (
            <pre className="mt-1 p-2 bg-gray-900 text-gray-100 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {sql}
            </pre>
          )}
        </div>
      )}

      {showActions && (
        <div className="mt-1 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs text-gray-400 hover:text-brand-600 inline-flex items-center gap-1"
          >
            {copyState === 'copied' ? 'Copied ✓' : 'Copy'}
          </button>
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="text-xs text-gray-400 hover:text-brand-600 inline-flex items-center gap-1"
            >
              Regenerate
            </button>
          )}
        </div>
      )}
    </div>
  )
}
