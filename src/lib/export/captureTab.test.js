import { describe, it, expect, vi } from 'vitest'

vi.mock('html-to-image', () => ({
  toPng: vi.fn(() => Promise.resolve('data:image/png;base64,HTML')),
}))

import { captureTab, collectSources } from './captureTab'
import { toPng } from 'html-to-image'

describe('collectSources', () => {
  it('reads text from elements marked data-export-source, trimmed', () => {
    const root = document.createElement('div')
    root.innerHTML = `
      <p data-export-source>Source:  FAO   FishStat</p>
      <p>not a source</p>
      <p data-export-source>Statistics Canada, Table 32-10-0107</p>
    `
    expect(collectSources(root)).toEqual([
      'Source: FAO FishStat',
      'Statistics Canada, Table 32-10-0107',
    ])
  })

  it('returns [] when root is null', () => {
    expect(collectSources(null)).toEqual([])
  })
})

describe('captureTab', () => {
  it('images Plotly sections via toImage and others via html-to-image, in order', async () => {
    const root = document.createElement('div')

    const plotSection = document.createElement('section')
    plotSection.innerHTML = '<h3>Heatmap</h3><div class="js-plotly-plot"></div>'

    const richSection = document.createElement('section')
    richSection.innerHTML = '<h3>KPIs</h3><div>stuff</div>'

    root.append(plotSection, richSection)

    const blocks = await captureTab(root)
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toMatchObject({ title: 'Heatmap' })
    expect(blocks[0].imageDataUrl).toMatch(/^data:image\/png/)
    expect(blocks[1]).toMatchObject({ title: 'KPIs' })
    expect(blocks[1].imageDataUrl).toBe('data:image/png;base64,HTML')
    expect(toPng).toHaveBeenCalledTimes(1) // only the rich section
  })

  it('returns [] for a null root', async () => {
    expect(await captureTab(null)).toEqual([])
  })

  it('skips a section whose capture throws and keeps the rest', async () => {
    toPng.mockRejectedValueOnce(new Error('boom'))
    const root = document.createElement('div')
    const bad = document.createElement('section')
    bad.innerHTML = '<h3>Bad</h3><div>x</div>'
    const good = document.createElement('section')
    good.innerHTML = '<h3>Good</h3><div>y</div>'
    root.append(bad, good)
    const blocks = await captureTab(root)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].title).toBe('Good')
  })

  it('descends through a single wrapper to reach the real section row', async () => {
    const root = document.createElement('div')
    const wrapper = document.createElement('div') // the tab's space-y-6 root
    const s1 = document.createElement('section')
    s1.innerHTML = '<h3>One</h3><div>a</div>'
    const s2 = document.createElement('section')
    s2.innerHTML = '<h3>Two</h3><div>b</div>'
    wrapper.append(s1, s2)
    root.append(wrapper) // root has exactly one wrapper child
    const blocks = await captureTab(root)
    expect(blocks.map(b => b.title)).toEqual(['One', 'Two'])
  })
})
