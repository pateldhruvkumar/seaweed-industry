import { PLOT_COLORS } from '../chartTheme'
import psiaLogoUrl from '../../assets/psia-logo-white-green.png'

// Brand palette, mirroring chartTheme so exports match the dashboard.
export const BRAND_TEAL = PLOT_COLORS[0] // '#0d9488'
export const BRAND_TEAL_DARK = '#0f766e' // teal-700
export const INK = '#0f172a'             // slate-900
export const MUTED = '#64748b'           // slate-500
export const DASHBOARD_NAME = 'Seaweed Industry Dashboard'
export const DASHBOARD_URL = 'https://seaweed-industry.vercel.app'

export { psiaLogoUrl }

/** Local-time YYYY-MM-DD. */
export function isoDate(d = new Date()) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** seaweed-<slug>-<date>.<ext> */
export function exportFilename(tabTitle, ext, date = new Date()) {
  const slug =
    (tabTitle || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'dashboard'
  return `seaweed-${slug}-${isoDate(date)}.${ext}`
}

/** Excel sheet name: <= 31 chars, no : \ / ? * [ ], deduped against `used`. */
export function sanitizeSheetName(name, used = new Set()) {
  const base =
    (name || 'Sheet').replace(/[:\\/?*[\]]/g, ' ').trim().slice(0, 31) || 'Sheet'
  let candidate = base
  let i = 2
  while (used.has(candidate)) {
    const suffix = ` (${i})`
    candidate = base.slice(0, 31 - suffix.length).trim() + suffix
    i += 1
  }
  used.add(candidate)
  return candidate
}

/** Fetch an image URL and resolve a base64 data URL (for jsPDF / pptxgenjs). */
export async function loadImageDataUrl(url) {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
