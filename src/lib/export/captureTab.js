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

function resolveSectionContainer(rootEl) {
  let container = rootEl
  // Tabs render their content inside a single wrapper element (e.g. a
  // `space-y-6` div); descend through such wrappers so we iterate the real
  // section row rather than treating the whole tab as one block.
  while (
    container.children.length === 1 &&
    container.firstElementChild &&
    container.firstElementChild.children.length > 1
  ) {
    container = container.firstElementChild
  }
  return container
}

/**
 * Walk the direct-child sections of `rootEl` and produce ordered image blocks
 * `{ title, imageDataUrl }`. Plotly sections (heatmap/EDA) are imaged with
 * `Plotly.toImage`; everything else (Recharts SVG, KPI strips, tables,
 * insight panels) is imaged with `html-to-image`.
 */
export async function captureTab(rootEl, { scale = 2 } = {}) {
  if (!rootEl) return []
  const container = resolveSectionContainer(rootEl)
  const blocks = []
  for (const section of Array.from(container.children)) {
    try {
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
          skipFonts: true,
        })
      }
      blocks.push({ title: sectionTitle(section), imageDataUrl })
    } catch (err) {
      console.warn('[captureTab] section capture failed, skipping:', err)
    }
  }
  return blocks
}
