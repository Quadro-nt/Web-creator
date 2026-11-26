import { describe, it, expect } from '@jest/globals'
import { normalizeSiteConfig } from '../site-config.schema'

describe('normalizeSiteConfig', () => {
  it('passes through new-shape config with pages[]', () => {
    const input = {
      template: 'minimal-gallery',
      pages: [{ slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] }],
      identity: { siteTitle: 'Luna' },
    }
    expect(normalizeSiteConfig(input)).toBe(input)
  })

  it('wraps old-shape sections[] into pages[] with a home page', () => {
    const sections = [{ id: 'cover', type: 'cover', variant: 'fullscreen', visible: true, content: {} }]
    const input = {
      template: 'minimal-gallery',
      sections,
      identity: { siteTitle: 'Luna Vega' },
    }
    const output = normalizeSiteConfig(input) as any

    expect(output.pages).toHaveLength(1)
    expect(output.pages[0]).toEqual({
      slug: 'home',
      title: 'Luna Vega',
      isHome: true,
      showInNav: true,
      sections,
    })
  })

  it('defaults title to "Inicio" when siteTitle missing', () => {
    const input = { template: 'minimal-gallery', sections: [], identity: {} }
    const output = normalizeSiteConfig(input) as any
    expect(output.pages[0].title).toBe('Inicio')
  })

  it('preserves header.customLinks even when wrapping', () => {
    const input = {
      template: 'editorial',
      sections: [],
      header: { layout: 'left', customLinks: [{ label: 'IG', href: 'https://instagram.com/x' }] },
      identity: { siteTitle: 'X' },
    }
    const output = normalizeSiteConfig(input) as any
    expect(output.header.customLinks).toEqual([{ label: 'IG', href: 'https://instagram.com/x' }])
  })

  it('returns non-object input unchanged', () => {
    expect(normalizeSiteConfig(null)).toBeNull()
    expect(normalizeSiteConfig(undefined)).toBeUndefined()
    expect(normalizeSiteConfig('string')).toBe('string')
    expect(normalizeSiteConfig(42)).toBe(42)
  })

  it('returns object without sections untouched (parser will reject)', () => {
    const input = { template: 'minimal-gallery' }
    const output = normalizeSiteConfig(input) as any
    expect(output.pages).toHaveLength(1)
    expect(output.pages[0].sections).toEqual([])
  })
})
