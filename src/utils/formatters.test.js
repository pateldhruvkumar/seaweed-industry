import { describe, it, expect } from 'vitest'
import { formatMt, formatUSD, formatPct, formatKt, formatCompact, formatFull } from './formatters'

describe('formatMt', () => {
  it('formats value to 2 dp with Mt suffix', () => {
    expect(formatMt(12.3456)).toBe('12.35 Mt')
  })
  it('returns dash for null', () => {
    expect(formatMt(null)).toBe('—')
  })
  it('returns dash for undefined', () => {
    expect(formatMt(undefined)).toBe('—')
  })
})

describe('formatUSD', () => {
  it('formats integer with dollar sign and commas', () => {
    expect(formatUSD(1234)).toBe('$1,234')
  })
  it('rounds decimals', () => {
    expect(formatUSD(1234.7)).toBe('$1,235')
  })
  it('returns dash for null', () => {
    expect(formatUSD(null)).toBe('—')
  })
})

describe('formatPct', () => {
  it('formats value to 1 dp with % suffix', () => {
    expect(formatPct(42.567)).toBe('42.6%')
  })
  it('returns dash for null', () => {
    expect(formatPct(null)).toBe('—')
  })
})

describe('formatCompact', () => {
  it('abbreviates millions with M', () => {
    expect(formatCompact(20000000)).toBe('20M')
  })
  it('rounds abbreviated values to at most 2 decimals', () => {
    expect(formatCompact(1525262.0589999997)).toBe('1.53M')
  })
  it('abbreviates thousands with K', () => {
    expect(formatCompact(2500)).toBe('2.5K')
  })
  it('abbreviates billions with B', () => {
    expect(formatCompact(2500000000)).toBe('2.5B')
  })
  it('keeps small numbers unabbreviated with at most 2 decimals', () => {
    expect(formatCompact(999)).toBe('999')
    expect(formatCompact(12.345)).toBe('12.35')
    expect(formatCompact(0)).toBe('0')
  })
  it('handles negative values', () => {
    expect(formatCompact(-1500000)).toBe('-1.5M')
  })
  it('returns empty string for null/undefined/non-numeric', () => {
    expect(formatCompact(null)).toBe('')
    expect(formatCompact(undefined)).toBe('')
    expect(formatCompact('abc')).toBe('')
  })
})

describe('formatFull', () => {
  it('shows the full number with thousands separators and at most 2 decimals', () => {
    expect(formatFull(1525262.0589999997)).toBe('1,525,262.06')
    expect(formatFull(20000000)).toBe('20,000,000')
  })
  it('keeps small numbers plain with at most 2 decimals', () => {
    expect(formatFull(12.345)).toBe('12.35')
    expect(formatFull(0)).toBe('0')
  })
  it('returns empty string for null/undefined/non-numeric', () => {
    expect(formatFull(null)).toBe('')
    expect(formatFull(undefined)).toBe('')
    expect(formatFull('abc')).toBe('')
  })
})

describe('formatKt', () => {
  it('formats value with kt suffix', () => {
    expect(formatKt(3456.78)).toBe('3,457 kt')
  })
  it('returns dash for null', () => {
    expect(formatKt(null)).toBe('—')
  })
})
