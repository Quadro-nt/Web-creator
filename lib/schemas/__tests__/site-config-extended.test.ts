import { describe, it, expect } from '@jest/globals'
import {
  SiteConfigSchema,
  cssColorSchema,
  optionalCssColorSchema,
  defaultSiteConfig,
  SiteConfig,
} from '../site-config.schema'

const fullValidConfig: SiteConfig = {
  template: 'minimal-gallery',
  styleTokens: {
    background: '#ffffff',
    text: '#1a1a1a',
    accent: '#c47a3a',
    fontPair: 'playfair-raleway',
    spacing: 'normal',
    artworkTreatment: 'margin',
  },
  button: {
    shape: 'rounded',
    style: 'filled',
    buyText: 'Consultar precio',
  },
  sizes: {
    typeScale: 'medium',
    artworkSize: 'medium',
    columns: '3',
    contentWidth: 'mid',
  },
  animations: {
    scrollReveal: 'soft',
    hoverEffect: 'info',
    pageTransition: 'fade',
  },
  navigation: {
    type: 'top',
    sticky: true,
  },
  sections: [
    { id: 'cover', type: 'cover', variant: 'fullscreen', visible: true, content: {} },
    { id: 'artworks', type: 'artworks', variant: 'grid', visible: true, content: {} },
  ],
  identity: {
    siteTitle: 'Mi Sitio de Arte',
    logoUrl: 'https://example.com/logo.png',
    coverImageUrl: 'https://example.com/cover.jpg',
    faviconUrl: 'https://example.com/favicon.ico',
    ogImageUrl: 'https://example.com/og.png',
  },
}

describe('SiteConfigSchema — extended', () => {
  it('valid full config passes validation', () => {
    const result = SiteConfigSchema.safeParse(fullValidConfig)
    expect(result.success).toBe(true)
  })

  it('config without sections field fails (sections is required)', () => {
    const { sections: _sections, ...noSections } = fullValidConfig
    const result = SiteConfigSchema.safeParse(noSections)
    expect(result.success).toBe(false)
  })

  it('config with empty sections array passes (empty array is valid)', () => {
    const result = SiteConfigSchema.safeParse({ ...fullValidConfig, sections: [] })
    expect(result.success).toBe(true)
  })

  it('buyText over 40 chars fails validation', () => {
    const result = SiteConfigSchema.safeParse({
      ...fullValidConfig,
      button: { ...fullValidConfig.button, buyText: 'A'.repeat(41) },
    })
    expect(result.success).toBe(false)
  })

  it('unknown fontPair fails validation', () => {
    const result = SiteConfigSchema.safeParse({
      ...fullValidConfig,
      styleTokens: { ...fullValidConfig.styleTokens, fontPair: 'comic-sans-impact' },
    })
    expect(result.success).toBe(false)
  })

  it('template minimal-gallery is valid', () => {
    const result = SiteConfigSchema.safeParse({ ...fullValidConfig, template: 'minimal-gallery' })
    expect(result.success).toBe(true)
  })

  it('template editorial is valid', () => {
    const result = SiteConfigSchema.safeParse({ ...fullValidConfig, template: 'editorial' })
    expect(result.success).toBe(true)
  })

  it('template immersive is valid', () => {
    const result = SiteConfigSchema.safeParse({ ...fullValidConfig, template: 'immersive' })
    expect(result.success).toBe(true)
  })

  it('template otro fails validation', () => {
    const result = SiteConfigSchema.safeParse({ ...fullValidConfig, template: 'otro' })
    expect(result.success).toBe(false)
  })

  it('columns 5 fails validation (only 2, 3, 4 are valid)', () => {
    const result = SiteConfigSchema.safeParse({
      ...fullValidConfig,
      sizes: { ...fullValidConfig.sizes, columns: '5' },
    })
    expect(result.success).toBe(false)
  })

  it('config without identity.siteTitle fails', () => {
    const { siteTitle: _siteTitle, ...identityWithoutTitle } = fullValidConfig.identity
    const result = SiteConfigSchema.safeParse({
      ...fullValidConfig,
      identity: identityWithoutTitle,
    })
    expect(result.success).toBe(false)
  })

  it('defaultSiteConfig passes validation', () => {
    const result = SiteConfigSchema.safeParse(defaultSiteConfig)
    expect(result.success).toBe(true)
  })

  it('cssColorSchema accepts valid hex, rgb/rgba, hsl/hsla and CSS named colors', () => {
    const validColors = [
      '#fff',
      '#1a1a1a',
      '#1a1a1a80',
      'rgb(255, 128, 0)',
      'rgba(128, 128, 128, 0.06)',
      'hsl(120, 100%, 50%)',
      'hsla(240, 50%, 50%, 0.5)',
      'white',
      'black',
      'transparent',
    ]
    for (const color of validColors) {
      expect(cssColorSchema.safeParse(color).success).toBe(true)
    }
  })

  it('cssColorSchema rejects CSS injection and XSS payloads', () => {
    const invalidColors = [
      '',
      '#ffffff; color: red',
      'red</style><script>alert(1)</script>',
      'url(https://evil.com/x.png)',
      '#fff { background: red }',
      'red\\',
      '"red"',
      "'red'",
      'rgb(0,0,0); }',
    ]
    for (const color of invalidColors) {
      expect(cssColorSchema.safeParse(color).success).toBe(false)
    }
  })

  it('optionalCssColorSchema accepts empty string and undefined but rejects injection', () => {
    expect(optionalCssColorSchema.safeParse(undefined).success).toBe(true)
    expect(optionalCssColorSchema.safeParse('').success).toBe(true)
    expect(optionalCssColorSchema.safeParse('#f5f5f5').success).toBe(true)
    expect(optionalCssColorSchema.safeParse('red; } body { display: none').success).toBe(false)
  })

  it('rejects malicious colors in styleTokens, announcementBar, header and footer', () => {
    const payload = '#fff; }</style><script>alert(1)</script>'

    expect(
      SiteConfigSchema.safeParse({
        ...fullValidConfig,
        styleTokens: { ...fullValidConfig.styleTokens, background: payload },
      }).success
    ).toBe(false)

    expect(
      SiteConfigSchema.safeParse({
        ...fullValidConfig,
        styleTokens: { ...fullValidConfig.styleTokens, secondaryBg: payload },
      }).success
    ).toBe(false)

    expect(
      SiteConfigSchema.safeParse({
        ...fullValidConfig,
        announcementBar: {
          enabled: true,
          backgroundColor: payload,
          textColor: '#ffffff',
          messages: ['Aviso'],
        },
      }).success
    ).toBe(false)

    expect(
      SiteConfigSchema.safeParse({
        ...fullValidConfig,
        header: {
          layout: 'left',
          backgroundColor: '#ffffff',
          textColor: payload,
        },
      }).success
    ).toBe(false)

    expect(
      SiteConfigSchema.safeParse({
        ...fullValidConfig,
        footer: {
          enabled: true,
          backgroundColor: payload,
          textColor: '',
        },
      }).success
    ).toBe(false)
  })
})
