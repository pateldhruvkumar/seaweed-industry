import { toPng } from 'html-to-image'
import * as plotlyModule from 'plotly.js-dist-min'

const Plotly = plotlyModule.default ?? plotlyModule

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

function sectionTitle(section) {
  const h = section.querySelector('h1, h2, h3')
  return h && h.textContent.trim() ? h.textContent.trim() : ''
}

/**
 * Walk the direct-child sections of `rootEl` and produce ordered image blocks
 * `{ title, imageDataUrl }`. Plotly sections (heatmap/EDA) are imaged with
 * `Plotly.toImage`; everything else (Recharts SVG, KPI strips, tables,
 * insight panels) is imaged with `html-to-image`.
 */
export async function captureTab(rootEl, { scale = 2 } = {}) {
  if (!rootEl) return []
  const blocks = []
  for (const section of Array.from(rootEl.children)) {
    const plotNode = section.querySelector('.js-plotly-plot')
    let imageDataUrl
    if (plotNode) {
      imageDataUrl = await Plotly.toImage(plotNode, {
        format: 'png',
        scale,
        width: plotNode.clientWidth || 900,
        height: plotNode.clientHeight || 460,
      })
    } else {
      imageDataUrl = await toPng(section, {
        pixelRatio: scale,
        backgroundColor: '#ffffff',
      })
    }
    blocks.push({ title: sectionTitle(section), imageDataUrl })
  }
  return blocks
}
