import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import MinimalGallery from '../minimal-gallery'
import EditorialTemplate from '../editorial'
import ImmersiveTemplate from '../immersive'
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
  it('MinimalGallery renders page.sections and skip link when given a page prop', () => {
    const { container } = render(
      <MinimalGallery config={baseConfig} page={basePage} works={[]} artistSlug="luna-vega" />
    )
    expect(container.firstChild).not.toBeNull()
    expect(screen.getByRole('link', { name: /saltar al contenido principal/i }).getAttribute('href')).toBe('#qs-main-content')
    expect(container.querySelector('main#qs-main-content')).not.toBeNull()
  })

  it('EditorialTemplate renders skip link and #qs-main-content', () => {
    const { container } = render(
      <EditorialTemplate config={baseConfig} page={basePage} works={[]} artistSlug="marco-torres" />
    )
    expect(screen.getByRole('link', { name: /saltar al contenido principal/i }).getAttribute('href')).toBe('#qs-main-content')
    expect(container.querySelector('main#qs-main-content')).not.toBeNull()
  })

  it('ImmersiveTemplate renders without scroll-jacking, exposes skip link and falls back cover title', () => {
    const titlePage: PageConfig = {
      ...basePage,
      sections: [
        { id: 'cover', type: 'cover', variant: 'cinematic', visible: true, content: { title: 'Luz Nocturna' } },
      ],
    }
    const { container } = render(
      <ImmersiveTemplate config={baseConfig} page={titlePage} works={[]} artistSlug="sofia-rios" />
    )
    const root = container.querySelector('.qs-site-root.qs-immersive-dialect') as HTMLElement | null
    expect(root).not.toBeNull()
    expect(root?.style.overflowY).toBe('')
    expect(root?.style.scrollSnapType).toBe('')
    expect(container.querySelector('main#qs-main-content')).not.toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Luz Nocturna' })).not.toBeNull()
  })
})
