export const formatMt = v =>
  v == null ? '—' : `${Number(v).toFixed(2)} Mt`

export const formatUSD = v =>
  v == null ? '—' : `$${Math.round(Number(v)).toLocaleString('en-US')}`

export const formatPct = v =>
  v == null ? '—' : `${Number(v).toFixed(1)}%`

export const formatKt = v =>
  v == null ? '—' : `${Math.round(Number(v)).toLocaleString('en-US')} kt`
