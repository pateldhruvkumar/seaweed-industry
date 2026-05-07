import * as factoryModule from 'react-plotly.js/factory'
import * as plotlyModule from 'plotly.js-dist-min'

// Both react-plotly.js/factory and plotly.js-dist-min ship as CommonJS, and
// Vite's ESM interop sometimes hands the default back wrapped in a namespace
// object ({ default: fn }) instead of unwrapped. Pull the real export off
// either shape so we always end up with the function and the Plotly object.
const createPlotlyComponent =
  typeof factoryModule.default === 'function'
    ? factoryModule.default
    : factoryModule
const Plotly = plotlyModule.default ?? plotlyModule

const Plot = createPlotlyComponent(Plotly)

export default Plot
