const CHART_KINDS = new Set(['line', 'bar', 'donut', 'scatter'])

function isNumericColumn(data, col) {
  let seen = false
  for (const row of data) {
    const v = row[col]
    if (v == null) continue
    if (typeof v !== 'number' || Number.isNaN(v)) return false
    seen = true
  }
  return seen
}

function isTimeColumn(data, col) {
  if (!isNumericColumn(data, col)) return false
  if (/period|year/i.test(col)) return true
  return data.every(row => {
    const v = row[col]
    return v == null || (Number.isInteger(v) && v >= 1900 && v <= 2100)
  })
}

function distinctCount(data, col) {
  return new Set(data.map(r => r[col])).size
}

/**
 * Hybrid chart selection. Returns a spec { kind, x, y, series } or null.
 * A valid backend `hint` wins; otherwise the chart is inferred from the
 * shape of `data`.
 */
export function inferChartSpec(data, hint) {
  if (!Array.isArray(data) || data.length < 2) return null
  const cols = Object.keys(data[0])

  if (hint && CHART_KINDS.has(hint.kind) && cols.includes(hint.x) && cols.includes(hint.y)) {
    const series = hint.series && cols.includes(hint.series) ? hint.series : null
    return { kind: hint.kind, x: hint.x, y: hint.y, series }
  }

  const numericCols = cols.filter(c => isNumericColumn(data, c))
  const timeCol = cols.find(c => isTimeColumn(data, c)) || null
  const categoryCols = cols.filter(c => !numericCols.includes(c))
  const measureCols = numericCols.filter(c => c !== timeCol)

  if (timeCol && measureCols.length >= 1) {
    const series = categoryCols.find(c => distinctCount(data, c) > 1) || null
    return { kind: 'line', x: timeCol, y: measureCols[0], series }
  }
  if (categoryCols.length >= 1 && measureCols.length >= 1) {
    return { kind: 'bar', x: categoryCols[0], y: measureCols[0], series: null }
  }
  if (measureCols.length >= 2) {
    return { kind: 'scatter', x: measureCols[0], y: measureCols[1], series: categoryCols[0] || null }
  }
  return null
}
