import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import SafeLink from '../SafeLink'

describe('SafeLink', () => {
  it('renders internal link with resolved href and no target', () => {
    render(<SafeLink href="/exhibitions" artistSlug="luna-vega">Ver</SafeLink>)
    const link = screen.getByRole('link', { name: 'Ver' })
    expect(link.getAttribute('href')).toBe('/sites/luna-vega/exhibitions')
    expect(link.getAttribute('target')).toBeNull()
  })
  it('renders external link with target=_blank and rel=noopener', () => {
    render(<SafeLink href="https://example.com" artistSlug="luna-vega">Ext</SafeLink>)
    const link = screen.getByRole('link', { name: 'Ext' })
    expect(link.getAttribute('href')).toBe('https://example.com')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })
  it('renders anchor link without target', () => {
    render(<SafeLink href="#top" artistSlug="luna-vega">Top</SafeLink>)
    const link = screen.getByRole('link', { name: 'Top' })
    expect(link.getAttribute('href')).toBe('#top')
    expect(link.getAttribute('target')).toBeNull()
  })
})
