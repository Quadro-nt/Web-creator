import { describe, it, expect } from '@jest/globals'
import { render } from '@testing-library/react'
import MinimalGallery from '../minimal-gallery'
import type { PageConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import { defaultSiteConfig } from '@/lib/schemas/site-config.schema'

const basePage: PageConfig = {
  slug: 'home',
  title: 'Home',
  isHome: true,
  showInNav: true,
  sections: [
    { id: 'cover', type: 'cover', variant: 'fullscreen', visible: true, content: {} },
  ],
}
const baseConfig: SiteConfig = { ...defaultSiteConfig, pages: [basePage] }

describe('template contract', () => {
  it('MinimalGallery renders page.sections when given a page prop', () => {
    const { container } = render(
      <MinimalGallery config={baseConfig} page={basePage} works={[]} artistSlug="luna-vega" />
    )
    // Smoke test: at least one element rendered.
    expect(container.firstChild).not.toBeNull()
  })
})
