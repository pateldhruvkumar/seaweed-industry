import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  useData, setActiveTab, getTabDatasetFilenames, getCachedData, __resetForTests,
} from './useData'

describe('useData export accessors', () => {
  beforeEach(() => {
    __resetForTests()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ json: () => Promise.resolve([{ year: 2020, v: 1 }]) })),
    )
  })

  it('attributes loaded datasets to the active tab and caches them', async () => {
    setActiveTab('overview')
    const { result } = renderHook(() => useData('demo_dataset.json'))

    // Recorded synchronously when the effect runs.
    expect(getTabDatasetFilenames('overview')).toContain('demo_dataset.json')

    await waitFor(() => expect(result.current.data).not.toBeNull())
    expect(getCachedData('demo_dataset.json')).toEqual([{ year: 2020, v: 1 }])
  })

  it('returns [] for a tab with no loads and null for an unknown file', () => {
    expect(getTabDatasetFilenames('never-visited')).toEqual([])
    expect(getCachedData('nope.json')).toBeNull()
  })
})
