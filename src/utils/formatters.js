export const formatMt = v =>
  v == null ? '—' : `${Number(v).toFixed(2)} Mt`

export const formatUSD = v =>
  v == null ? '—' : `$${Math.round(Number(v)).toLocaleString('en-US')}`

export const formatPct = v =>
  v == null ? '—' : `${Number(v).toFixed(1)}%`

export const formatKt = v =>
  v == null ? '—' : `${Math.round(Number(v)).toLocaleString('en-US')} kt`

// Axis-tick formatter: 20000000 -> "20M", 2500 -> "2.5K", 12.345 -> "12.35".
export const formatCompact = v => {
  const n = Number(v)
  if (v == null || v === '' || !Number.isFinite(n)) return ''
  const trim = x => String(Number(x.toFixed(2)))
  const abs = Math.abs(n)
  if (abs >= 1e9) return `${trim(n / 1e9)}B`
  if (abs >= 1e6) return `${trim(n / 1e6)}M`
  if (abs >= 1e3) return `${trim(n / 1e3)}K`
  return trim(n)
}
