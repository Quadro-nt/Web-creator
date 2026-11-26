import { describe, it, expect } from '@jest/globals'

describe('ArtistSubPage module', () => {
  it('exports default function and generateMetadata', async () => {
    const mod = await import('../page')
    expect(typeof mod.default).toBe('function')
    expect(typeof mod.generateMetadata).toBe('function')
  })
})

describe('ArtistSubPage logic', () => {
  it('finds page by slug, excluding home', () => {
    const pages = [
      { slug: 'home', isHome: true, title: 'Home', showInNav: true, sections: [] },
      { slug: 'exhibitions', isHome: false, title: 'Exhibitions', showInNav: true, sections: [] },
    ]
    const found = pages.find((p) => p.slug === 'exhibitions' && !p.isHome)
    expect(found?.slug).toBe('exhibitions')

    const foundHome = pages.find((p) => p.slug === 'home' && !p.isHome)
    expect(foundHome).toBeUndefined()
  })
})
