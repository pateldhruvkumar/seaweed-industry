import { useState, useCallback, useRef } from 'react'

/**
 * Drives a tab export. `exporting` holds the in-flight format (or null);
 * `error` holds a user-facing message (or null). `run(format)` lazy-loads
 * the export module so its heavy deps stay out of the initial bundle.
 */
export function useExport({ tabId, tabTitle, tabSubtitle }) {
  const [exporting, setExporting] = useState(null)
  const [error, setError] = useState(null)
  const inFlight = useRef(false)

  const run = useCallback(
    async format => {
      if (inFlight.current) return
      inFlight.current = true
      setError(null)
      setExporting(format)
      try {
        const rootEl = document.getElementById('tab-content')
        if (!rootEl) {
          throw new Error('Wait for the tab to finish loading, then try again.')
        }
        const { exportTab } = await import('../lib/export')
        await exportTab(format, { rootEl, tabId, tabTitle, tabSubtitle })
      } catch (e) {
        console.error('[export] failed:', e)
        setError(e.message || 'Export failed')
      } finally {
        setExporting(null)
        inFlight.current = false
      }
    },
    [tabId, tabTitle, tabSubtitle],
  )

  return { exporting, error, run }
}
