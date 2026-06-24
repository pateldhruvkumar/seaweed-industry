import { describe, it, expect, vi } from 'vitest'
import { isoDate, exportFilename, sanitizeSheetName, loadImageDataUrl } from './branding'

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

describe('sanitizeSheetName (long-name dedupe)', () => {
  it('keeps deduped names within 31 chars when the base is long', () => {
    const used = new Set()
    const long = 'x'.repeat(40)
    const a = sanitizeSheetName(long, used)
    const b = sanitizeSheetName(long, used)
    expect(a.length).toBeLessThanOrEqual(31)
    expect(b.length).toBeLessThanOrEqual(31)
    expect(b).not.toBe(a)
  })
})

describe('loadImageDataUrl', () => {
  it('resolves a data URL on a successful fetch', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, blob: () => Promise.resolve(new Blob(['x'], { type: 'image/png' })) }),
    )
    const out = await loadImageDataUrl('/logo.png')
    expect(String(out)).toMatch(/^data:/)
  })
  it('rejects on a non-ok HTTP status', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 404 }))
    await expect(loadImageDataUrl('/missing.png')).rejects.toThrow('404')
  })
})
