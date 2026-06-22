import PptxGenJS from 'pptxgenjs'
import { captureTab, collectSources } from './captureTab'
import {
  BRAND_TEAL, DASHBOARD_NAME, isoDate, psiaLogoUrl, loadImageDataUrl,
} from './branding'

// pptxgenjs colors are hex strings without '#'.
const hex = c => c.replace('#', '')

/** Build a lightly-branded 16:9 deck of the tab as a Blob. */
export async function buildPptxBlob({ rootEl, tabTitle, tabSubtitle }) {
  const blocks = await captureTab(rootEl)
  const sources = collectSources(rootEl)
  const logo = await loadImageDataUrl(psiaLogoUrl).catch(() => null)

  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 })
  pptx.layout = 'WIDE'

  // Title slide
  const title = pptx.addSlide()
  title.background = { color: hex(BRAND_TEAL) }
  if (logo) title.addImage({ data: logo, x: 0.5, y: 0.5, w: 2.2, h: 0.8 })
  title.addText(tabTitle || DASHBOARD_NAME, {
    x: 0.6, y: 2.6, w: 12, h: 1, fontSize: 36, bold: true, color: 'FFFFFF',
  })
  if (tabSubtitle) {
    title.addText(tabSubtitle, { x: 0.6, y: 3.7, w: 12, h: 1, fontSize: 16, color: 'E2F4F1' })
  }
  title.addText(`${DASHBOARD_NAME} · ${isoDate()}`, {
    x: 0.6, y: 6.8, w: 12, fontSize: 10, color: 'E2F4F1',
  })

  // Content slides
  const footnote = sources.length ? `Sources: ${sources.join(' · ')}` : ''
  blocks.forEach(block => {
    const s = pptx.addSlide()
    if (block.title) {
      s.addText(block.title, {
        x: 0.5, y: 0.3, w: 12.3, h: 0.6, fontSize: 20, bold: true, color: '0F172A',
      })
    }
    s.addImage({
      data: block.imageDataUrl,
      x: 0.7, y: 1.1, w: 11.9, h: 5.6,
      sizing: { type: 'contain', w: 11.9, h: 5.6 },
    })
    if (footnote) {
      s.addText(footnote, { x: 0.5, y: 7.0, w: 12.3, fontSize: 8, color: '64748B' })
    }
  })

  return pptx.write('blob')
}
