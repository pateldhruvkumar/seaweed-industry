import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useData } from './useData'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useData', () => {
  it('returns loading true initially', () => {
    global.fetch = vi.fn(() => new Promise(() => {}))
    const { result } = renderHook(() => useData('test.json'))
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
  })

  it('returns parsed data after fetch resolves', async () => {
    const mockData = [{ year: 2020, value: 1.5 }]
    global.fetch = vi.fn(() =>
      Promise.resolve({ json: () => Promise.resolve(mockData) })
    )
    const { result } = renderHook(() => useData('test2.json'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('returns error string when fetch rejects', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('network fail')))
    const { result } = renderHook(() => useData('bad.json'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('network fail')
    expect(result.current.data).toBeNull()
  })
})
