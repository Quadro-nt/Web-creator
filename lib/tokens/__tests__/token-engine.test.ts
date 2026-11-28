import { describe, it, expect } from '@jest/globals'
import { generateTokenStyles } from '../token-engine'
import { getContrastRatio } from '../contrast'
import { defaultSiteConfig } from '../../schemas/site-config.schema'

describe('generateTokenStyles', () => {
  it('generates a string containing --color-bg', () => {
    const css = generateTokenStyles(defaultSiteConfig)
    expect(typeof css).toBe('string')
    expect(css).toContain('--color-bg')
  })

  it('generated text color meets WCAG AA (ratio >= 4.5) against background', () => {
    const css = generateTokenStyles(defaultSiteConfig)
    const bgMatch = css.match(/--color-bg:\s*(#[0-9a-fA-F]{6})/)
    const textMatch = css.match(/--color-text:\s*(#[0-9a-fA-F]{6})/)
    expect(bgMatch).not.toBeNull()
    expect(textMatch).not.toBeNull()
    if (bgMatch && textMatch) {
      const ratio = getContrastRatio(textMatch[1], bgMatch[1])
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('includes Google Fonts @import', () => {
    const css = generateTokenStyles(defaultSiteConfig)
    expect(css).toContain('@import url(')
    expect(css).toContain('fonts.googleapis.com')
  })

  it('includes spacing custom properties', () => {
    const css = generateTokenStyles(defaultSiteConfig)
    expect(css).toContain('--spacing-xs')
    expect(css).toContain('--spacing-md')
    expect(css).toContain('--spacing-xl')
  })

  it('includes type scale custom properties', () => {
    const css = generateTokenStyles(defaultSiteConfig)
    expect(css).toContain('--text-base')
    expect(css).toContain('--text-4xl')
  })

  it('includes artwork treatment class', () => {
    const css = generateTokenStyles(defaultSiteConfig)
    expect(css).toContain('.artwork-treatment')
  })

  it('scopes variables and rules to custom selector when provided', () => {
    const css = generateTokenStyles(defaultSiteConfig, '.qs-site-root')
    expect(css).toContain('.qs-site-root {')
    expect(css).toContain('.qs-site-root .artwork-treatment')
    expect(css).toContain('@container qs-canvas (min-width: 860px)')
    expect(css).toContain('.qs-site-root .qs-editorial-catalog')
    expect(css).not.toContain(':root {')
  })

  it('aplica tipografías personalizadas, mayúsculas, radios y keyframes de marquee', () => {
    const css = generateTokenStyles({
      ...defaultSiteConfig,
      styleTokens: {
        ...defaultSiteConfig.styleTokens,
        headingFont: 'Bagel Fat One',
        bodyFont: 'Barlow Condensed',
        uppercaseHeadings: true,
        borderRadius: 'lg',
        cardBorder: true,
      },
    })
    expect(css).toContain('Bagel+Fat+One')
    expect(css).toContain('Barlow+Condensed')
    expect(css).toContain('--heading-transform: uppercase;')
    expect(css).toContain('--radius-media: 14px;')
    expect(css).toContain('--card-border: 1px solid currentColor;')
    expect(css).toContain('@keyframes qs-marquee-left')
  })

  it('sanitiza valores de color maliciosos (defensa en profundidad) y preserva contraste WCAG', () => {
    const css = generateTokenStyles({
      ...defaultSiteConfig,
      styleTokens: {
        ...defaultSiteConfig.styleTokens,
        background: '#ffffff; } body { display: none',
        text: 'red</style><script>alert(1)</script>',
        accent: 'url(https://evil.com/x)',
        secondaryBg: 'rgba(0,0,0,1); } * { color: red',
      },
    })

    expect(css).not.toContain('display: none')
    expect(css).not.toContain('</style>')
    expect(css).not.toContain('<script>')
    expect(css).not.toContain('url(https://evil.com/x)')
    expect(css).toContain('--color-bg: #ffffff;')
    expect(css).toContain('--color-surface: rgba(128,128,128,0.06);')

    const bgMatch = css.match(/--color-bg:\s*(#[0-9a-fA-F]{6})/)
    const textMatch = css.match(/--color-text:\s*(#[0-9a-fA-F]{6})/)
    expect(bgMatch).not.toBeNull()
    expect(textMatch).not.toBeNull()
    if (bgMatch && textMatch) {
      expect(getContrastRatio(textMatch[1], bgMatch[1])).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('permite colores CSS seguros en formato rgb, hsl y nombre', () => {
    const css = generateTokenStyles({
      ...defaultSiteConfig,
      styleTokens: {
        ...defaultSiteConfig.styleTokens,
        background: 'white',
        text: 'rgb(20, 20, 20)',
        accent: 'hsl(25, 60%, 45%)',
        secondaryBg: 'rgba(10, 10, 10, 0.05)',
      },
    })
    expect(css).toContain('--color-bg: white;')
    expect(css).toContain('--color-surface: rgba(10, 10, 10, 0.05);')
  })

  it('emite --color-on-accent, aliases --qs-*, foco visible, skip-link y reduce motion', () => {
    const css = generateTokenStyles(defaultSiteConfig, '.qs-site-root')
    expect(css).toContain('--color-on-accent:')
    expect(css).toContain('--qs-bg: var(--color-bg);')
    expect(css).toContain('--qs-text: var(--color-text);')
    expect(css).toContain('--qs-accent: var(--color-accent);')
    expect(css).toContain('--qs-on-accent: var(--color-on-accent);')
    expect(css).toContain('--qs-secondary-bg: var(--color-surface);')
    expect(css).toContain('--qs-font-heading: var(--font-heading);')
    expect(css).toContain('--qs-font-body: var(--font-body);')
    expect(css).toContain('.qs-site-root .qs-scheme-accent { background-color: var(--color-accent); color: var(--color-on-accent); }')
    expect(css).toContain(':focus-visible')
    expect(css).toContain('.qs-skip-link')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('.qs-marquee-track { animation: none !important; }')

    const darkCss = generateTokenStyles(
      {
        ...defaultSiteConfig,
        styleTokens: {
          ...defaultSiteConfig.styleTokens,
          background: '#0a0a0a',
          text: '#f5f5f5',
          accent: '#d4a373',
        },
      },
      '.qs-site-root'
    )
    expect(darkCss).toContain('--color-on-accent: #111111;')
  })
})
