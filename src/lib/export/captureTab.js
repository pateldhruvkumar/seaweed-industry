/**
 * Collect source/caveat citations marked with `data-export-source`.
 * Whitespace is collapsed so multi-line SourceNote markup reads as one line.
 */
export function collectSources(rootEl) {
  if (!rootEl) return []
  return Array.from(rootEl.querySelectorAll('[data-export-source]'))
    .map(el => el.textContent.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}
