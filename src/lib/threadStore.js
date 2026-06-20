/**
 * Saved-thread persistence over localStorage. Phase C of the AI chat.
 *
 * Schema (localStorage key `psia.threads`):
 *   { id, title, createdAt, updatedAt, messages }[]
 *
 * Only the display fields of each message are persisted, and assistant messages
 * are stored already-"done": the typewriter's `targetContent` is folded into
 * `content` and the transient `streaming`/`targetContent` fields are dropped, so
 * a reloaded thread renders statically (see AssistantMessage).
 *
 * Every read/write is wrapped in try/catch: a corrupt value or a quota/denied
 * localStorage never throws into the UI — we degrade to an ephemeral session.
 */

const KEY = 'psia.threads'
const TITLE_MAX = 40

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function readAll() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(threads) {
  try {
    localStorage.setItem(KEY, JSON.stringify(threads))
  } catch {
    // Quota exceeded or storage unavailable — drop silently.
  }
}

function normalizeMessage(m) {
  return {
    role: m.role,
    content: m.targetContent ?? m.content ?? '',
    sql: m.sql ?? null,
    data: m.data ?? [],
    type: m.type ?? null,
    chart: m.chart ?? null,
    suggestions: m.suggestions ?? [],
  }
}

export function deriveTitle(messages) {
  const firstUser = (messages ?? []).find(m => m.role === 'user')
  const text = (firstUser?.content ?? '').trim()
  if (!text) return 'New chat'
  return text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX).trimEnd()}…` : text
}

export function listThreads() {
  return readAll().sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
}

export function getThread(id) {
  return readAll().find(t => t.id === id) ?? null
}

export function saveThread(id, messages) {
  const threads = readAll()
  const now = Date.now()
  const existing = id ? threads.find(t => t.id === id) : null
  const saved = {
    id: existing?.id ?? id ?? newId(),
    title: deriveTitle(messages),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    messages: (messages ?? []).map(normalizeMessage),
  }
  const next = existing
    ? threads.map(t => (t.id === saved.id ? saved : t))
    : [...threads, saved]
  writeAll(next)
  return saved
}

export function deleteThread(id) {
  writeAll(readAll().filter(t => t.id !== id))
}
