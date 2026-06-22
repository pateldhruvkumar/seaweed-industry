import { describe, it, expect } from 'vitest'
import { collectSources } from './captureTab'

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
