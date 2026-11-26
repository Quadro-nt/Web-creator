import { describe, it, expect } from '@jest/globals'
import { SiteConfigSchema, defaultSiteConfig, SiteConfig } from '../site-config.schema'

const validConfig: SiteConfig = {
  template: 'editorial',
  styleTokens: {
    background: '#f5f0eb',
    text: '#222222',
    accent: '#8b4513',
    fontPair: 'merriweather-open-sans',
    spacing: 'spacious',
    artworkTreatment: 'frame',
  },
  button: {
    shape: 'pill',
    style: 'outlined',
    buyText: 'Adquirir obra',
  },
  sizes: {
    typeScale: 'large',
    artworkSize: 'large',
    columns: '2',
    contentWidth: 'narrow',
  },
  animations: {
    scrollReveal: 'bold',
    hoverEffect: 'zoom',
    pageTransition: 'none',
  },
  navigation: {
    type: 'hamburger',
    sticky: false,
  },
  pages: [
    {
      slug: 'home',
      title: 'Galería Luna Vega',
      isHome: true,
      showInNav: true,
      sections: [
        { id: 'cover', type: 'cover', variant: 'minimal', visible: true, content: { headline: 'Arte' } },
        { id: 'artworks', type: 'artworks', variant: 'masonry', visible: true, content: {} },
      ],
    },
  ],
  identity: {
    siteTitle: 'Galería Luna Vega',
    logoUrl: 'https://example.com/logo.png',
  },
}

describe('SiteConfigSchema', () => {
  it('validates a valid config successfully', () => {
    const result = SiteConfigSchema.safeParse(validConfig)
    expect(result.success).toBe(true)
  })

  it('rejects a config with an unknown fontPair', () => {
    const invalid = {
      ...validConfig,
      styleTokens: { ...validConfig.styleTokens, fontPair: 'comic-sans-papyrus' },
    }
    const result = SiteConfigSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects a config without siteTitle', () => {
    const invalid = {
      ...validConfig,
      identity: { ...validConfig.identity, siteTitle: '' },
    }
    const result = SiteConfigSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('validates defaultSiteConfig successfully', () => {
    const result = SiteConfigSchema.safeParse(defaultSiteConfig)
    expect(result.success).toBe(true)
  })
})
