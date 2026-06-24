import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  listThreads,
  getThread,
  saveThread,
  deleteThread,
  deriveTitle,
} from './threadStore'

beforeEach(() => localStorage.clear())

const userMsg = text => ({ role: 'user', content: text, sql: null, data: [], type: null })
const botMsg = target => ({
  role: 'assistant',
  content: '',
  targetContent: target,
  sql: 'SELECT 1',
  data: [{ a: 1 }],
  type: 'table',
  chart: null,
  suggestions: ['next?'],
  streaming: true,
})

describe('threadStore', () => {
  it('returns an empty list when nothing is stored', () => {
    expect(listThreads()).toEqual([])
  })

  it('returns an empty list (no throw) when the stored value is corrupt', () => {
    localStorage.setItem('psia.threads', '{not json')
    expect(listThreads()).toEqual([])
  })

  it('creates, gets, and lists a thread (round-trip)', () => {
    const saved = saveThread(null, [userMsg('hello')])
    expect(saved.id).toBeTruthy()
    expect(getThread(saved.id)).toMatchObject({ id: saved.id, title: 'hello' })
    expect(listThreads()).toHaveLength(1)
  })

  it('updates an existing thread in place (same id)', () => {
    const a = saveThread(null, [userMsg('hi')])
    const b = saveThread(a.id, [userMsg('hi'), botMsg('answer')])
    expect(b.id).toBe(a.id)
    expect(listThreads()).toHaveLength(1)
    expect(getThread(a.id).messages).toHaveLength(2)
  })

  it('normalizes assistant messages to done form (targetContent → content, no streaming)', () => {
    const saved = saveThread(null, [userMsg('q'), botMsg('the answer')])
    const bot = getThread(saved.id).messages[1]
    expect(bot.content).toBe('the answer')
    expect(bot).not.toHaveProperty('targetContent')
    expect(bot).not.toHaveProperty('streaming')
    expect(bot.suggestions).toEqual(['next?'])
  })

  it('derives the title from the first user message, truncated to 40 chars', () => {
    const long = 'a'.repeat(60)
    expect(deriveTitle([userMsg(long)])).toBe(`${'a'.repeat(40)}…`)
    expect(deriveTitle([botMsg('x'), userMsg('real question')])).toBe('real question')
    expect(deriveTitle([])).toBe('New chat')
  })

  it('lists threads newest-updated first', () => {
    const first = saveThread(null, [userMsg('first')])
    vi.spyOn(Date, 'now').mockReturnValue(first.updatedAt + 1000)
    const second = saveThread(null, [userMsg('second')])
    Date.now.mockRestore()
    expect(listThreads().map(t => t.id)).toEqual([second.id, first.id])
  })

  it('deletes a thread by id', () => {
    const a = saveThread(null, [userMsg('a')])
    const b = saveThread(null, [userMsg('b')])
    deleteThread(a.id)
    expect(listThreads().map(t => t.id)).toEqual([b.id])
  })
})
