import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const exportTab = vi.fn(() => Promise.resolve())
vi.mock('../lib/export', () => ({ exportTab: (...a) => exportTab(...a) }))

import { useExport } from './useExport'

describe('useExport', () => {
  beforeEach(() => {
    exportTab.mockReset().mockResolvedValue()
    document.body.innerHTML = '<div id="tab-content"></div>'
  })

  it('calls exportTab with tab options and clears the exporting flag', async () => {
    const { result } = renderHook(() =>
      useExport({ tabId: 'overview', tabTitle: 'Overview', tabSubtitle: 'sub' }),
    )
    await act(async () => { await result.current.run('xlsx') })

    expect(exportTab).toHaveBeenCalledWith('xlsx', expect.objectContaining({
      tabId: 'overview', tabTitle: 'Overview', tabSubtitle: 'sub',
    }))
    expect(result.current.exporting).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('records an error when the export fails', async () => {
    exportTab.mockRejectedValueOnce(new Error('boom'))
    const { result } = renderHook(() => useExport({ tabId: 't', tabTitle: 'T' }))
    await act(async () => { await result.current.run('xlsx') })
    await waitFor(() => expect(result.current.error).toBe('boom'))
  })

  it('errors when there is no #tab-content', async () => {
    document.body.innerHTML = ''
    const { result } = renderHook(() => useExport({ tabId: 't', tabTitle: 'T' }))
    await act(async () => { await result.current.run('xlsx') })
    expect(result.current.error).toMatch(/wait for the tab/i)
    expect(exportTab).not.toHaveBeenCalled()
  })
})
