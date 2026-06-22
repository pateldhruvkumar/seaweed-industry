import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./toExcel', () => ({
  buildExcelBlob: vi.fn(() => new Blob(['x'], { type: 'application/octet-stream' })),
}))

import { exportTab } from './index'
import { buildExcelBlob } from './toExcel'

describe('exportTab', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake'),
      revokeObjectURL: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    buildExcelBlob.mockClear()
  })

  it('builds an xlsx blob and triggers a download with the right filename', async () => {
    await exportTab('xlsx', {
      rootEl: null, tabId: 't', tabTitle: 'Overview', tabSubtitle: '',
    })
    expect(buildExcelBlob).toHaveBeenCalledOnce()
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
  })

  it('throws on an unsupported format', async () => {
    await expect(
      exportTab('rtf', { rootEl: null, tabId: 't', tabTitle: 'X' }),
    ).rejects.toThrow(/unsupported/i)
  })
})
