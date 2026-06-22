import { describe, it, expect } from 'vitest'
import { isoDate, exportFilename, sanitizeSheetName } from './branding'

describe('isoDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(isoDate(new Date(2026, 5, 22))).toBe('2026-06-22')
  })
})

describe('exportFilename', () => {
  it('builds seaweed-<slug>-<date>.<ext>', () => {
    expect(exportFilename('Canada · Economics', 'xlsx', new Date(2026, 5, 22)))
      .toBe('seaweed-canada-economics-2026-06-22.xlsx')
  })
  it('falls back to "dashboard" for empty titles', () => {
    expect(exportFilename('', 'pdf', new Date(2026, 5, 22)))
      .toBe('seaweed-dashboard-2026-06-22.pdf')
  })
})

describe('sanitizeSheetName', () => {
  it('strips illegal chars and truncates to 31', () => {
    const long = 'a/b:c'.padEnd(40, 'x')
    const out = sanitizeSheetName(long)
    expect(out.length).toBeLessThanOrEqual(31)
    expect(out).not.toMatch(/[:\\/?*[\]]/)
  })
  it('dedupes against names already used', () => {
    const used = new Set()
    const a = sanitizeSheetName('Sheet', used)
    const b = sanitizeSheetName('Sheet', used)
    expect(a).toBe('Sheet')
    expect(b).not.toBe('Sheet')
  })
})
