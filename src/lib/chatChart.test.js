import { describe, it, expect } from 'vitest'
import { inferChartSpec } from './chatChart'

const TIME_SERIES = [
  { PERIOD: 2010, VALUE: 5, Country_Name: 'China' },
  { PERIOD: 2011, VALUE: 6, Country_Name: 'China' },
  { PERIOD: 2010, VALUE: 2, Country_Name: 'Japan' },
  { PERIOD: 2011, VALUE: 3, Country_Name: 'Japan' },
]

const RANKING = [
  { Country_Name: 'China', total: 100 },
  { Country_Name: 'Indonesia', total: 80 },
]

describe('inferChartSpec', () => {
  it('returns null for fewer than 2 rows or non-arrays', () => {
    expect(inferChartSpec([{ a: 1 }], null)).toBeNull()
    expect(inferChartSpec(null, null)).toBeNull()
    expect(inferChartSpec(undefined, null)).toBeNull()
  })

  it('infers a grouped line chart from a time + value + category shape', () => {
    expect(inferChartSpec(TIME_SERIES, null)).toEqual({
      kind: 'line', x: 'PERIOD', y: 'VALUE', series: 'Country_Name',
    })
  })

  it('infers a line with null series when there is one category value', () => {
    const data = [
      { year: 2010, VALUE: 5 },
      { year: 2011, VALUE: 6 },
    ]
    expect(inferChartSpec(data, null)).toEqual({
      kind: 'line', x: 'year', y: 'VALUE', series: null,
    })
  })

  it('infers a bar chart from a category + numeric shape with no time column', () => {
    expect(inferChartSpec(RANKING, null)).toEqual({
      kind: 'bar', x: 'Country_Name', y: 'total', series: null,
    })
  })

  it('infers a scatter chart from two numeric measures with no time/category', () => {
    const data = [
      { quantity: 10, value: 100 },
      { quantity: 20, value: 250 },
    ]
    expect(inferChartSpec(data, null)).toEqual({
      kind: 'scatter', x: 'quantity', y: 'value', series: null,
    })
  })

  it('honors a valid backend hint over the heuristic', () => {
    const hint = { kind: 'donut', x: 'Country_Name', y: 'total', series: null }
    expect(inferChartSpec(RANKING, hint)).toEqual(hint)
  })

  it('drops a hint series that is not a real column but keeps the chart', () => {
    const hint = { kind: 'bar', x: 'Country_Name', y: 'total', series: 'ghost' }
    expect(inferChartSpec(RANKING, hint)).toEqual({
      kind: 'bar', x: 'Country_Name', y: 'total', series: null,
    })
  })

  it('falls back to the heuristic when the hint references a missing column', () => {
    const hint = { kind: 'line', x: 'ghost', y: 'total', series: null }
    expect(inferChartSpec(RANKING, hint)).toEqual({
      kind: 'bar', x: 'Country_Name', y: 'total', series: null,
    })
  })

  it('prefers a value-word measure over a numeric id column', () => {
    const data = [
      { id: 1, Country_Name: 'China', total: 100 },
      { id: 2, Country_Name: 'Japan', total: 80 },
    ]
    expect(inferChartSpec(data, null)).toEqual({
      kind: 'bar', x: 'Country_Name', y: 'total', series: null,
    })
  })

  it('rejects a hint whose x and y are the same column and falls back to the heuristic', () => {
    const data = [
      { Country_Name: 'China', total: 100 },
      { Country_Name: 'Indonesia', total: 80 },
    ]
    const hint = { kind: 'bar', x: 'total', y: 'total', series: null }
    expect(inferChartSpec(data, hint)).toEqual({
      kind: 'bar', x: 'Country_Name', y: 'total', series: null,
    })
  })

  it('returns null for an empty array', () => {
    expect(inferChartSpec([], null)).toBeNull()
  })
})
