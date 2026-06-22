import { describe, it, expect, vi } from 'vitest'

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

vi.mock('./captureTab', () => ({
  captureTab: vi.fn(() => Promise.resolve([{ title: 'Chart A', imageDataUrl: PNG }])),
  collectSources: vi.fn(() => ['Source: FAO FishStat']),
}))

import { buildPdfBlob, buildPdfDoc } from './toPdf'
import { captureTab, collectSources } from './captureTab'

describe('buildPdfBlob', () => {
  it('returns a non-empty PDF Blob', async () => {
    const blob = await buildPdfBlob({
      rootEl: document.createElement('div'),
      tabTitle: 'Overview',
      tabSubtitle: 'sub',
    })
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
  })

  it('paginates multiple blocks and invokes captureTab/collectSources', async () => {
    captureTab.mockResolvedValueOnce(
      Array.from({ length: 8 }, (_, i) => ({ title: `C${i}`, imageDataUrl: PNG })),
    )
    const rootEl = document.createElement('div')
    const doc = await buildPdfDoc({ rootEl, tabTitle: 'Overview', tabSubtitle: '' })
    expect(captureTab).toHaveBeenCalledWith(rootEl)
    expect(collectSources).toHaveBeenCalledWith(rootEl)
    expect(doc.getNumberOfPages()).toBeGreaterThan(1)
  })
})
