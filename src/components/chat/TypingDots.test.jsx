import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import TypingDots from './TypingDots'

describe('TypingDots', () => {
  it('renders three dots', () => {
    const { container } = render(<TypingDots />)
    const dots = container.querySelectorAll('[data-dot]')
    expect(dots).toHaveLength(3)
  })

  it('each dot uses the brand-400 background', () => {
    const { container } = render(<TypingDots />)
    container.querySelectorAll('[data-dot]').forEach(d => {
      expect(d.className).toMatch(/bg-brand-400/)
    })
  })
})
