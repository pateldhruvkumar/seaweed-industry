import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('disables the trigger while exporting', () => {
    mockState = { exporting: 'xlsx', error: null, run }
    render(<ExportMenu tabId="t" tabTitle="T" />)
    expect(screen.getByRole('button', { name: /exporting/i })).toBeDisabled()
  })

  it('closes the menu on an outside click', async () => {
    render(<ExportMenu tabId="t" tabTitle="T" />)
    await userEvent.click(screen.getByRole('button', { name: /export/i }))
    expect(screen.getByText(/excel/i)).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText(/excel/i)).not.toBeInTheDocument()
  })
})
