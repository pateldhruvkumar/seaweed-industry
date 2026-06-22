import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('./toExcel', () => ({
  buildExcelBlob: vi.fn(() => new Blob(['x'], { type: 'application/octet-stream' })),
}))

vi.mock('./toPdf', () => ({
  buildPdfBlob: vi.fn(() => Promise.resolve(new Blob(['pdf'], { type: 'application/pdf' }))),
}))

import { exportTab } from './index'
import { buildExcelBlob } from './toExcel'
import { buildPdfBlob } from './toPdf'

describe('exportTab', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake'),
      revokeObjectURL: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    buildExcelBlob.mockClear()
    buildPdfBlob.mockClear()
  })

  afterEach(() => { vi.restoreAllMocks() })

  it('builds an xlsx blob and triggers a download with the right filename', async () => {
    const anchors = []
    vi.spyOn(document.body, 'appendChild').mockImplementation(el => {
      anchors.push(el)
      return el
    })
    await exportTab('xlsx', {
      rootEl: null, tabId: 't', tabTitle: 'Overview', tabSubtitle: '',
    })
    expect(buildExcelBlob).toHaveBeenCalledOnce()
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake')
    expect(anchors[0].download).toMatch(/^seaweed-overview-\d{4}-\d{2}-\d{2}\.xlsx$/)
  })

  it('throws on an unsupported format', async () => {
    await expect(
      exportTab('rtf', { rootEl: null, tabId: 't', tabTitle: 'X' }),
    ).rejects.toThrow(/unsupported/i)
  })

  it('builds a pdf blob for the pdf format', async () => {
    await exportTab('pdf', { rootEl: null, tabId: 't', tabTitle: 'Overview' })
    expect(buildPdfBlob).toHaveBeenCalledOnce()
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
  })
})
