import { jsPDF } from 'jspdf'
import { captureTab, collectSources } from './captureTab'
import {
  BRAND_TEAL, DASHBOARD_NAME, INK, MUTED,
  isoDate, psiaLogoUrl, loadImageDataUrl,
} from './branding'

const PAGE = { w: 595.28, h: 841.89 } // A4 portrait, pt
const MARGIN = 40
const HEADER_H = 64
const FOOTER_Y = PAGE.h - 24

function drawHeader(doc, title, subtitle, logo) {
  doc.setFillColor(BRAND_TEAL)
  doc.rect(0, 0, PAGE.w, HEADER_H, 'F')
  if (logo) {
    try { doc.addImage(logo, 'PNG', MARGIN, 16, 90, 32) } catch { /* ignore */ }
  }
  doc.setTextColor('#ffffff')
  doc.setFontSize(9)
  doc.text(`${DASHBOARD_NAME} · ${isoDate()}`, PAGE.w - MARGIN, 28, { align: 'right' })

  let y = HEADER_H + 28
  doc.setTextColor(INK)
  doc.setFontSize(18)
  doc.text(title || '', MARGIN, y)
  y += 16
  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(MUTED)
    const lines = doc.splitTextToSize(subtitle, PAGE.w - MARGIN * 2)
    doc.text(lines, MARGIN, y)
    y += lines.length * 12
  }
  return y + 10
}

function drawFooters(doc, sources) {
  const pages = doc.getNumberOfPages()
  const srcLine = sources.length ? `Sources: ${sources.join(' · ')}` : ''
  const clipped = srcLine.length > 150 ? `${srcLine.slice(0, 147)}…` : srcLine
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(MUTED)
    if (clipped) doc.text(clipped, MARGIN, FOOTER_Y, { maxWidth: PAGE.w - MARGIN * 2 - 40 })
    doc.text(`${p} / ${pages}`, PAGE.w - MARGIN, FOOTER_Y, { align: 'right' })
  }
}

/** Build the PDF document. Exported for testing. */
export async function buildPdfDoc({ rootEl, tabTitle, tabSubtitle }) {
  const blocks = await captureTab(rootEl)
  const sources = collectSources(rootEl)
  const logo = await loadImageDataUrl(psiaLogoUrl).catch(() => null)

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  let y = drawHeader(doc, tabTitle, tabSubtitle, logo)
  const contentW = PAGE.w - MARGIN * 2

  for (const block of blocks) {
    const props = doc.getImageProperties(block.imageDataUrl)
    if (!props.width || !props.height) continue // skip degenerate capture

    const titleH = block.title ? 16 : 0
    let imgW = contentW
    let imgH = (props.height / props.width) * contentW

    // Start a fresh page if this block won't fit in the remaining space.
    if (y + titleH + imgH > PAGE.h - 60) {
      doc.addPage()
      y = drawHeader(doc, tabTitle, tabSubtitle, logo)
    }
    if (block.title) {
      doc.setFontSize(11)
      doc.setTextColor(INK)
      doc.text(block.title, MARGIN, y)
      y += titleH
    }

    // Cap to the page's available height, preserving aspect ratio (centered).
    const availH = FOOTER_Y - y - 10
    if (imgH > availH) {
      const scale = availH / imgH
      imgW = contentW * scale
      imgH = availH
    }
    const x = MARGIN + (contentW - imgW) / 2
    doc.addImage(block.imageDataUrl, 'PNG', x, y, imgW, imgH)
    y += imgH + 24
  }

  drawFooters(doc, sources)
  return doc
}

/** Build a lightly-branded PDF of the tab as a Blob. */
export async function buildPdfBlob(opts) {
  const doc = await buildPdfDoc(opts)
  return doc.output('blob')
}
