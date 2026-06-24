import { describe, it, expect, vi } from 'vitest'

const slide = { background: undefined, addText: vi.fn(), addImage: vi.fn() }
const pptxInstance = {
  defineLayout: vi.fn(),
  layout: '',
  addSlide: vi.fn(() => slide),
  write: vi.fn(() => Promise.resolve(new Blob(['pptx']))),
}
vi.mock('pptxgenjs', () => ({ default: vi.fn(function () { return pptxInstance }) }))
vi.mock('./captureTab', () => ({
  captureTab: vi.fn(() => Promise.resolve([
    { title: 'Chart A', imageDataUrl: 'data:image/png;base64,AAAA' },
  ])),
  collectSources: vi.fn(() => ['Source: FAO']),
}))

import { buildPptxBlob } from './toPptx'

describe('buildPptxBlob', () => {
  it('builds a title slide + one slide per block and returns a Blob', async () => {
    const blob = await buildPptxBlob({
      rootEl: document.createElement('div'),
      tabTitle: 'Overview',
      tabSubtitle: 'sub',
    })
    expect(pptxInstance.addSlide).toHaveBeenCalledTimes(2) // title + 1 content
    expect(slide.addImage).toHaveBeenCalled()
    expect(blob).toBeInstanceOf(Blob)
  })
})
