import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import SparkAvatar from './SparkAvatar'

describe('SparkAvatar', () => {
  it('renders at the requested size in pixels', () => {
    const { container } = render(<SparkAvatar size={48} />)
    const root = container.firstChild
    expect(root).toHaveStyle({ width: '48px', height: '48px' })
  })

  it('applies a glow shadow when withGlow is true', () => {
    const { container } = render(<SparkAvatar size={24} withGlow />)
    expect(container.firstChild.className).toMatch(/shadow-/)
  })

  it('omits the glow class when withGlow is false', () => {
    const { container } = render(<SparkAvatar size={24} />)
    expect(container.firstChild.className).not.toMatch(/shadow-\[/)
  })

  it('contains an SVG sparkle', () => {
    const { container } = render(<SparkAvatar size={24} />)
    expect(container.querySelector('svg')).not.toBeNull()
  })
})
