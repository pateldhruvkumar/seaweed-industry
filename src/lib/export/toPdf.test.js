import { describe, it, expect, vi } from 'vitest'

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

vi.mock('./captureTab', () => ({
  captureTab: vi.fn(() => Promise.resolve([{ title: 'Chart A', imageDataUrl: PNG }])),
  collectSources: vi.fn(() => ['Source: FAO FishStat']),
}))

import { buildPdfBlob } from './toPdf'

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
})
