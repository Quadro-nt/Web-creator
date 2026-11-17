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
})
