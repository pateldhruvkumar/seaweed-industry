import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../hooks/useData', () => ({
  getTabDatasetFilenames: vi.fn(),
  getCachedData: vi.fn(),
}))

import { getTabDatasetFilenames, getCachedData } from '../../hooks/useData'
import { buildWorkbook, buildExcelBlob } from './toExcel'

describe('buildWorkbook', () => {
  beforeEach(() => {
    getTabDatasetFilenames.mockReset()
    getCachedData.mockReset()
  })

  it('dedupes sheets when a dataset name collides with About', () => {
    getTabDatasetFilenames.mockReturnValue(['About.json', 'prod.json'])
    getCachedData.mockImplementation(() => [{ year: 2020, value: 1 }])
    const wb = buildWorkbook({ tabId: 't', tabTitle: 'T', rootEl: null })
    const names = wb.SheetNames
    expect(new Set(names).size).toBe(names.length) // all unique
    expect(names[0]).toBe('About')
    expect(names).toContain('About (2)')
  })

  it('adds an About sheet first plus one sheet per array dataset', () => {
    getTabDatasetFilenames.mockReturnValue(['prod.json', 'matrix.json'])
    getCachedData.mockImplementation(fn =>
      fn === 'prod.json'
        ? [{ year: 2020, value: 1 }, { year: 2021, value: 2 }]
        : { countries: ['CA'], values: [[1]] },
    )

    const wb = buildWorkbook({ tabId: 't', tabTitle: 'Overview', rootEl: null })
    expect(wb.SheetNames[0]).toBe('About')
    expect(wb.SheetNames).toContain('prod')
    expect(wb.SheetNames).not.toContain('matrix')
  })
})

describe('buildExcelBlob', () => {
  it('returns a non-empty Blob', () => {
    getTabDatasetFilenames.mockReturnValue([])
    getCachedData.mockReturnValue(null)
    const blob = buildExcelBlob({ tabId: 't', tabTitle: 'Overview', rootEl: null })
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
  })
})
