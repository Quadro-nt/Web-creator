import { describe, it, expect } from '@jest/globals'
import { buildInitialSiteConfig } from '../artist-onboarding'

describe('buildInitialSiteConfig new-shape output', () => {
  it('returns a config with pages[] containing a single home page', () => {
    const config = buildInitialSiteConfig({
      displayName: 'Luna Vega',
      template: 'minimal-gallery',
    })
    expect(config.pages).toHaveLength(1)
    expect(config.pages[0]).toMatchObject({
      slug: 'home',
      title: 'Luna Vega',
      isHome: true,
      showInNav: true,
    })
    expect(config.pages[0].sections.length).toBeGreaterThan(0)
  })

  it('does not put sections at the root', () => {
    const config = buildInitialSiteConfig({
      displayName: 'Marco',
      template: 'editorial',
    }) as any
    expect(config.sections === undefined || config.sections.length === 0).toBe(true)
  })
})
