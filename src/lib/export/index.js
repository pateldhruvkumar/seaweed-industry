import { exportFilename } from './branding'
import { buildExcelBlob } from './toExcel'
import { buildPdfBlob } from './toPdf'
import { buildPptxBlob } from './toPptx'

/** Trigger a browser download for a Blob. */
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/**
 * Build and download the current tab in the requested format.
 * opts: { rootEl, tabId, tabTitle, tabSubtitle }
 */
export async function exportTab(format, opts) {
  let blob
  let ext
  if (format === 'xlsx') {
    blob = buildExcelBlob(opts)
    ext = 'xlsx'
  } else if (format === 'pdf') {
    blob = await buildPdfBlob(opts)
    ext = 'pdf'
  } else if (format === 'pptx') {
    blob = await buildPptxBlob(opts)
    ext = 'pptx'
  } else {
    throw new Error(`Unsupported export format: ${format}`)
  }
  triggerDownload(blob, exportFilename(opts.tabTitle, ext))
}
