import * as XLSX from 'xlsx'
import { getTabDatasetFilenames, getCachedData } from '../../hooks/useData'
import { collectSources } from './captureTab'
import {
  DASHBOARD_NAME, DASHBOARD_URL, isoDate, sanitizeSheetName,
} from './branding'

const CAVEAT =
  'Source datasets as loaded; charts on the dashboard may apply year-range filters.'

/** Build a SheetJS workbook for a tab. Exported for testing. */
export function buildWorkbook({ tabId, tabTitle, rootEl }) {
  const wb = XLSX.utils.book_new()
  const used = new Set()
  const aboutName = sanitizeSheetName('About', used) // reserve "About" first
  const sources = collectSources(rootEl)
  const matrixDatasets = []

  getTabDatasetFilenames(tabId).forEach(fn => {
    const data = getCachedData(fn)
    const isTabular =
      Array.isArray(data) && data.length > 0 &&
      data[0] !== null && typeof data[0] === 'object'
    if (isTabular) {
      const ws = XLSX.utils.json_to_sheet(data)
      const name = sanitizeSheetName(fn.replace(/\.json$/i, ''), used)
      XLSX.utils.book_append_sheet(wb, ws, name)
    } else if (data != null) {
      matrixDatasets.push(fn)
    }
  })

  const aboutRows = [
    [DASHBOARD_NAME],
    [tabTitle || ''],
    [`Exported: ${isoDate()}`],
    [DASHBOARD_URL],
    [],
    ['Note', CAVEAT],
    [],
    ['Sources'],
    ...sources.map(s => [s]),
  ]
  if (matrixDatasets.length) {
    aboutRows.push([], ['Matrix data — see dashboard'], ...matrixDatasets.map(m => [m]))
  }
  const aboutWs = XLSX.utils.aoa_to_sheet(aboutRows)
  XLSX.utils.book_append_sheet(wb, aboutWs, aboutName)

  // Put About first.
  wb.SheetNames = [aboutName, ...wb.SheetNames.filter(n => n !== aboutName)]
  return wb
}

/** Build the workbook and serialize it to an .xlsx Blob. */
export function buildExcelBlob(opts) {
  const wb = buildWorkbook(opts)
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
