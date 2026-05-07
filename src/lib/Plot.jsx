import { useEffect, useRef } from 'react'
import * as plotlyModule from 'plotly.js-dist-min'

// plotly.js-dist-min is a UMD bundle — under Vite's CJS interop, the default
// export may or may not be unwrapped, so accept either shape.
const Plotly = plotlyModule.default ?? plotlyModule

/**
 * Minimal React wrapper around plotly.js. Replaces react-plotly.js because its
 * CJS default export can't be reliably unwrapped under Vite/esbuild interop —
 * we kept hitting "Element type is invalid" and "createPlotlyComponent is not
 * a function" depending on which entry point we tried.
 *
 * Supports the props our chart components actually use: data, layout, config,
 * useResizeHandler, style, className.
 */
export default function Plot({
  data = [],
  layout = {},
  config = {},
  useResizeHandler = false,
  style,
  className,
}) {
  const containerRef = useRef(null)

  // (Re-)render the plot whenever data/layout/config change. Plotly.react does
  // its own internal diffing, so passing fresh object identities each render
  // is fine and idiomatic.
  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    Plotly.react(node, data, layout, config)
  }, [data, layout, config])

  // Mirror react-plotly.js' useResizeHandler: re-run plotly's resize logic
  // whenever the window changes size. We only attach the listener if the
  // caller opted in.
  useEffect(() => {
    if (!useResizeHandler) return
    const handler = () => {
      if (containerRef.current) Plotly.Plots.resize(containerRef.current)
    }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [useResizeHandler])

  // Tear down plotly state when the chart unmounts so we don't leak DOM
  // listeners between tab switches.
  useEffect(() => {
    return () => {
      if (containerRef.current) Plotly.purge(containerRef.current)
    }
  }, [])

  return <div ref={containerRef} style={style} className={className} />
}
