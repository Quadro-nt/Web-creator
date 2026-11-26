import { describe, it, expect } from '@jest/globals'
import { PageConfigSchema, SiteConfigSchema, defaultSiteConfig } from '../site-config.schema'

describe('PageConfigSchema', () => {
  const base = {
    slug: 'exhibitions',
    title: 'Exhibitions',
    isHome: false,
    showInNav: true,
    sections: [],
  }
  it('accepts a valid page', () => {
    expect(() => PageConfigSchema.parse(base)).not.toThrow()
  })
  it('rejects slug with uppercase', () => {
    expect(() => PageConfigSchema.parse({ ...base, slug: 'Exhibitions' })).toThrow()
  })
  it('rejects empty slug', () => {
    expect(() => PageConfigSchema.parse({ ...base, slug: '' })).toThrow()
  })
  it('rejects slug with special chars', () => {
    expect(() => PageConfigSchema.parse({ ...base, slug: 'my page' })).toThrow()
    expect(() => PageConfigSchema.parse({ ...base, slug: 'my/page' })).toThrow()
  })
  it('rejects empty title', () => {
    expect(() => PageConfigSchema.parse({ ...base, title: '' })).toThrow()
  })
})

describe('SiteConfigSchema with pages', () => {
  const minimalPages = [
    { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
  ]
  const base = { ...defaultSiteConfig, pages: minimalPages }

  it('accepts config with pages[]', () => {
    expect(() => SiteConfigSchema.parse(base)).not.toThrow()
  })
  it('rejects empty pages[]', () => {
    expect(() => SiteConfigSchema.parse({ ...base, pages: [] })).toThrow(/exactamente una página/)
  })
  it('rejects 2 pages with isHome=true', () => {
    const pages = [
      { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
      { slug: 'about', title: 'About', isHome: true, showInNav: true, sections: [] },
    ]
    expect(() => SiteConfigSchema.parse({ ...base, pages })).toThrow(/exactamente una/)
  })
  it('rejects 0 pages with isHome=true', () => {
    const pages = [
      { slug: 'home', title: 'Home', isHome: false, showInNav: true, sections: [] },
    ]
    expect(() => SiteConfigSchema.parse({ ...base, pages })).toThrow(/exactamente una/)
  })
  it('rejects duplicate slugs', () => {
    const pages = [
      { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
      { slug: 'home', title: 'Home2', isHome: false, showInNav: true, sections: [] },
    ]
    expect(() => SiteConfigSchema.parse({ ...base, pages })).toThrow(/slugs de página deben ser únicos/)
  })
  it('rejects reserved slug "obras"', () => {
    const pages = [
      { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
      { slug: 'obras', title: 'Obras', isHome: false, showInNav: true, sections: [] },
    ]
    expect(() => SiteConfigSchema.parse({ ...base, pages })).toThrow(/reservado/)
  })
})
