import { toPng } from 'html-to-image'
import * as plotlyModule from 'plotly.js-dist-min'

const Plotly = plotlyModule.default ?? plotlyModule

/** Reject if `promise` doesn't settle within `ms`. */
function withTimeout(promise, ms, label) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} capture exceeded ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

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
    container.firstElementChild.tagName !== 'SECTION' &&
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
export async function captureTab(rootEl, { scale = 2, captureTimeout = 15000 } = {}) {
  if (!rootEl) return []
  const container = resolveSectionContainer(rootEl)
  const blocks = []
  for (const section of Array.from(container.children)) {
    try {
      const plotNode = section.querySelector('.js-plotly-plot')
      let imageDataUrl
      if (plotNode) {
        imageDataUrl = await withTimeout(
          Plotly.toImage(plotNode, {
            format: 'png',
            scale,
            width: plotNode.clientWidth || 900,
            height: plotNode.clientHeight || 460,
          }),
          captureTimeout,
          'plotly',
        )
      } else {
        imageDataUrl = await withTimeout(
          toPng(section, {
            pixelRatio: scale,
            backgroundColor: '#ffffff',
            skipFonts: true,
          }),
          captureTimeout,
          'section',
        )
      }
      blocks.push({ title: sectionTitle(section), imageDataUrl })
    } catch (err) {
      console.warn('[captureTab] section capture failed or timed out, skipping:', err)
    }
  }
  return blocks
}
