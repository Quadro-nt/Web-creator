import { describe, it, expect } from '@jest/globals'
import {
  addPage,
  deletePage,
  setHomePage,
  movePage,
  duplicatePage,
  renamePage,
} from '../page-operations'
import { defaultSiteConfig, type SiteConfig, type PageConfig } from '@/lib/schemas/site-config.schema'

const baseConfig: SiteConfig = {
  ...defaultSiteConfig,
  pages: [
    { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
    { slug: 'bio', title: 'Bio', isHome: false, showInNav: true, sections: [] },
  ],
}

describe('addPage', () => {
  it('appends a new page with unique slug and defaults', () => {
    const next = addPage(baseConfig, { title: 'Exhibitions', slug: 'exhibitions' })
    expect(next.pages).toHaveLength(3)
    expect(next.pages![2]).toEqual({
      slug: 'exhibitions',
      title: 'Exhibitions',
      isHome: false,
      showInNav: true,
      sections: [],
    })
  })
  it('throws if slug collides with existing', () => {
    expect(() => addPage(baseConfig, { title: 'Home 2', slug: 'home' })).toThrow(/ya existe/i)
  })
  it('copies sections when preset is "copy-from"', () => {
    const configWithSections: SiteConfig = {
      ...baseConfig,
      pages: [
        {
          slug: 'home',
          title: 'Home',
          isHome: true,
          showInNav: true,
          sections: [
            { id: 'cover-1', type: 'cover', variant: 'fullscreen', visible: true, content: {} },
          ],
        },
      ],
    }
    const next = addPage(configWithSections, {
      title: 'Clone',
      slug: 'clone',
      copyFromSlug: 'home',
    })
    expect(next.pages![1].sections).toHaveLength(1)
    expect(next.pages![1].sections[0].id).not.toBe('cover-1') // fresh IDs
  })
})

describe('deletePage', () => {
  it('removes a non-home page', () => {
    const next = deletePage(baseConfig, 'bio')
    expect(next.pages).toHaveLength(1)
    expect(next.pages![0].slug).toBe('home')
  })
  it('throws when trying to delete the home page', () => {
    expect(() => deletePage(baseConfig, 'home')).toThrow(/home/i)
  })
  it('throws when slug does not exist', () => {
    expect(() => deletePage(baseConfig, 'nope')).toThrow(/no existe/)
  })
})

describe('setHomePage', () => {
  it('moves isHome flag to the new page atomically', () => {
    const next = setHomePage(baseConfig, 'bio')
    expect(next.pages!.find((p) => p.slug === 'bio')?.isHome).toBe(true)
    expect(next.pages!.find((p) => p.slug === 'home')?.isHome).toBe(false)
    expect(next.pages!.filter((p) => p.isHome)).toHaveLength(1)
  })
  it('throws if target slug does not exist', () => {
    expect(() => setHomePage(baseConfig, 'nope')).toThrow(/no existe/)
  })
})

describe('movePage', () => {
  it('reorders pages', () => {
    const config: SiteConfig = {
      ...baseConfig,
      pages: [
        { slug: 'a', title: 'A', isHome: true, showInNav: true, sections: [] },
        { slug: 'b', title: 'B', isHome: false, showInNav: true, sections: [] },
        { slug: 'c', title: 'C', isHome: false, showInNav: true, sections: [] },
      ],
    }
    const next = movePage(config, 2, 0)
    expect(next.pages!.map((p) => p.slug)).toEqual(['c', 'a', 'b'])
  })
  it('noop for same index', () => {
    const next = movePage(baseConfig, 0, 0)
    expect(next).toBe(baseConfig)
  })
})

describe('duplicatePage', () => {
  it('creates a copy with unique slug sufix', () => {
    const next = duplicatePage(baseConfig, 'bio')
    expect(next.pages).toHaveLength(3)
    expect(next.pages![2].slug).toBe('bio-copy')
    expect(next.pages![2].isHome).toBe(false)
  })
  it('increments suffix when -copy already exists', () => {
    const config: SiteConfig = {
      ...baseConfig,
      pages: [
        ...baseConfig.pages!,
        { slug: 'bio-copy', title: 'Bio Copy', isHome: false, showInNav: false, sections: [] },
      ],
    }
    const next = duplicatePage(config, 'bio')
    expect(next.pages![next.pages!.length - 1].slug).toBe('bio-copy-2')
  })
})

describe('renamePage', () => {
  it('updates title, slug, showInNav', () => {
    const next = renamePage(baseConfig, 'bio', {
      title: 'About',
      slug: 'about',
      showInNav: false,
    })
    const page = next.pages!.find((p) => p.slug === 'about')!
    expect(page.title).toBe('About')
    expect(page.showInNav).toBe(false)
  })
  it('throws if new slug collides with another page', () => {
    expect(() =>
      renamePage(baseConfig, 'bio', { title: 'Home', slug: 'home', showInNav: true })
    ).toThrow(/ya existe/i)
  })
})
