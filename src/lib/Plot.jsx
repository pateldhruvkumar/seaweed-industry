import { useEffect, useMemo, useRef } from 'react'
import * as plotlyModule from 'plotly.js-dist-min'
import { mergeLayout, mergeConfig } from './plotlyTheme'

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

  // Merge caller's layout/config on top of the centralized theme defaults so
  // every chart in the app inherits Inter font, refined gridlines, the brand
  // color cycle, and consistent hover styling without per-chart boilerplate.
  const themedLayout = useMemo(() => mergeLayout(layout), [layout])
  const themedConfig = useMemo(() => mergeConfig(config), [config])

  // (Re-)render the plot whenever data/layout/config change. Plotly.react does
  // its own internal diffing, so passing fresh object identities each render
  // is fine and idiomatic.
  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    Plotly.react(node, data, themedLayout, themedConfig)
  }, [data, themedLayout, themedConfig])

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
