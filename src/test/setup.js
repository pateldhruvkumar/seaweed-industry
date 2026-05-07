import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('react-plotly.js', () => ({
  default: () => null,
}))

// We now build the Plot component via the factory in src/lib/Plot.jsx —
// stub the factory so tests don't load the real plotly.js bundle.
vi.mock('react-plotly.js/factory', () => ({
  default: () => () => null,
}))
