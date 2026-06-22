import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const run = vi.fn()
let mockState = { exporting: null, error: null, run }
vi.mock('../../hooks/useExport', () => ({ useExport: () => mockState }))

import ExportMenu from './ExportMenu'

describe('ExportMenu', () => {
  beforeEach(() => {
    run.mockReset()
    mockState = { exporting: null, error: null, run }
  })

  it('opens the menu and runs the chosen format', async () => {
    render(<ExportMenu tabId="overview" tabTitle="Overview" tabSubtitle="sub" />)
    await userEvent.click(screen.getByRole('button', { name: /export/i }))
    await userEvent.click(screen.getByText(/excel/i))
    expect(run).toHaveBeenCalledWith('xlsx')
  })

  it('shows an error message when present', () => {
    mockState = { exporting: null, error: 'Export failed', run }
    render(<ExportMenu tabId="t" tabTitle="T" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Export failed')
  })
})
