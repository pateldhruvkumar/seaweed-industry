import { describe, it, expect } from 'vitest'
import { formatMt, formatUSD, formatPct, formatKt } from './formatters'

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

describe('formatKt', () => {
  it('formats value with kt suffix', () => {
    expect(formatKt(3456.78)).toBe('3,457 kt')
  })
  it('returns dash for null', () => {
    expect(formatKt(null)).toBe('—')
  })
})
