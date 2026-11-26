import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import SiteHeader from '../SiteHeader'
import type { SiteConfig } from '@/lib/schemas/site-config.schema'
import { defaultSiteConfig } from '@/lib/schemas/site-config.schema'

const makeConfig = (pages: any[]): SiteConfig => ({
  ...defaultSiteConfig,
  header: {
    layout: 'left',
    backgroundColor: '#ffffff',
    textColor: '#000000',
  },
  pages,
})

describe('SiteHeader auto-nav', () => {
  it('renders a link per page with showInNav=true', () => {
    const config = makeConfig([
      { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
      { slug: 'exhibitions', title: 'Exhibitions', isHome: false, showInNav: true, sections: [] },
      { slug: 'hidden', title: 'Hidden', isHome: false, showInNav: false, sections: [] },
    ])
    render(<SiteHeader config={config} artistSlug="luna-vega" />)
    expect(screen.getByRole('link', { name: /home/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /exhibitions/i })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /hidden/i })).toBeNull()
  })

  it('uses navLabel override when present', () => {
    const config = makeConfig([
      { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [], navLabel: 'Inicio' },
    ])
    render(<SiteHeader config={config} artistSlug="luna-vega" />)
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeTruthy()
  })

  it('home link points to /sites/<slug> (no sub-path)', () => {
    const config = makeConfig([
      { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
    ])
    render(<SiteHeader config={config} artistSlug="luna-vega" />)
    const link = screen.getByRole('link', { name: /home/i })
    expect(link.getAttribute('href')).toBe('/sites/luna-vega')
  })

  it('sub-page link points to /sites/<slug>/<pageSlug>', () => {
    const config = makeConfig([
      { slug: 'home', title: 'Home', isHome: true, showInNav: true, sections: [] },
      { slug: 'exhibitions', title: 'Exhibitions', isHome: false, showInNav: true, sections: [] },
    ])
    render(<SiteHeader config={config} artistSlug="luna-vega" />)
    const link = screen.getByRole('link', { name: /exhibitions/i })
    expect(link.getAttribute('href')).toBe('/sites/luna-vega/exhibitions')
  })
})
