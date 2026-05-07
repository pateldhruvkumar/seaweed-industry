import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Our charts ultimately render via plotly.js-dist-min through src/lib/Plot.jsx.
// Stub the heavy plotly bundle so tests don't load it; the local Plot wrapper
// will still mount as a plain <div ref> and any Plotly.react() calls become
// no-ops, which is exactly what tests want.
vi.mock('plotly.js-dist-min', () => ({
  default: {
    react: () => Promise.resolve(),
    purge: () => {},
    Plots: { resize: () => {} },
  },
}))
