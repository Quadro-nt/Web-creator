import { describe, it, expect } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react'
import InteractiveArtworksGrid from '../shared/InteractiveArtworksGrid'
import EditorialNav from '../editorial/nav'
import MinimalGalleryNav from '../minimal-gallery/nav'
import SiteFooter from '../shared/SiteFooter'
import EditorialContact from '../editorial/sections/contact'
import { Navigation } from '@/components/Navigation'
import { defaultSiteConfig, type SectionConfig, type SiteConfig } from '@/lib/schemas/site-config.schema'
import type { Artwork } from '@/lib/schemas/works.schema'

const sampleWorks: Artwork[] = [
  {
    slug: 'formas-01',
    title: 'Amanecer',
    year: 2024,
    medium: 'óleo sobre lienzo',
    dimensions: '80 x 100 cm',
    price: 1200,
    currency: 'PEN',
    sold: false,
    images: ['https://example.com/1.jpg'],
    tags: [],
  },
]

const gridSection: SectionConfig = {
  id: 's2',
  type: 'artworks',
  variant: 'grid',
  visible: true,
  content: {},
}

describe('InteractiveArtworksGrid Phase 2 curatorial polish', () => {
  it('uses SafeLink (/sites/<slug>/obras/<work>) and lazy/async thumbnails', () => {
    render(
      <InteractiveArtworksGrid
        section={gridSection}
        works={sampleWorks}
        artistSlug="luna-vega"
        config={defaultSiteConfig}
        templateVariant="minimal-gallery"
      />,
    )

    const link = screen.getByRole('link', { name: /Amanecer/i })
    expect(link.getAttribute('href')).toBe('/sites/luna-vega/obras/formas-01')

    const img = screen.getByAltText('Amanecer') as HTMLImageElement
    expect(img.getAttribute('loading')).toBe('lazy')
    expect(img.getAttribute('decoding')).toBe('async')
    expect(img.style.objectFit).toBe('contain')
    expect(img.parentElement?.style.aspectRatio).toBe('4/5')
  })

  it('uses object-fit cover only when treatment is bleed in minimal-gallery', () => {
    const bleedConfig: SiteConfig = {
      ...defaultSiteConfig,
      styleTokens: { ...defaultSiteConfig.styleTokens, artworkTreatment: 'bleed' },
    }
    render(
      <InteractiveArtworksGrid
        section={gridSection}
        works={sampleWorks}
        artistSlug="luna-vega"
        config={bleedConfig}
        templateVariant="minimal-gallery"
      />,
    )

    const img = screen.getByAltText('Amanecer') as HTMLImageElement
    expect(img.style.objectFit).toBe('cover')
  })

  it('uses natural aspect ratio in immersive and mosaic variants', () => {
    const { rerender } = render(
      <InteractiveArtworksGrid
        section={gridSection}
        works={sampleWorks}
        artistSlug="sofia-rios"
        config={defaultSiteConfig}
        templateVariant="immersive"
      />,
    )

    let img = screen.getByAltText('Amanecer') as HTMLImageElement
    expect(img.style.width).toBe('100%')
    expect(img.style.height).toBe('auto')

    rerender(
      <InteractiveArtworksGrid
        section={{ ...gridSection, variant: 'mosaic' }}
        works={sampleWorks}
        artistSlug="luna-vega"
        config={defaultSiteConfig}
        templateVariant="minimal-gallery"
      />,
    )
    img = screen.getByAltText('Amanecer') as HTMLImageElement
    expect(img.style.width).toBe('100%')
    expect(img.style.height).toBe('auto')
  })

  it('renders editorial list as 2-column catalogue raisonne container with SafeLink', () => {
    const { container } = render(
      <InteractiveArtworksGrid
        section={{ ...gridSection, variant: 'list' }}
        works={sampleWorks}
        artistSlug="marco-torres"
        config={defaultSiteConfig}
        templateVariant="editorial"
      />,
    )

    expect(container.querySelector('.qs-editorial-catalog')).not.toBeNull()
    const link = screen.getByRole('link', { name: /Amanecer/i })
    expect(link.getAttribute('href')).toBe('/sites/marco-torres/obras/formas-01')
  })
})

describe('Nav, SiteFooter and EditorialContactForm polish', () => {
  it('replaces "Edición en curso" with "Catálogo razonado" and removes fixed "Hecho con Quadro"', () => {
    const { container: edContainer } = render(
      <EditorialNav config={defaultSiteConfig} artistSlug="marco-torres" />,
    )
    expect(screen.getByText('Catálogo razonado')).toBeTruthy()
    expect(screen.queryByText('Edición en curso')).toBeNull()
    expect(edContainer.querySelector('footer[style*="fixed"]')).toBeNull()

    const { container: minContainer } = render(
      <MinimalGalleryNav config={defaultSiteConfig} artistSlug="luna-vega" />,
    )
    expect(minContainer.querySelector('footer[style*="fixed"]')).toBeNull()

    const { container: legacyNav } = render(
      <Navigation
        config={{ ...defaultSiteConfig, navigation: { type: 'hamburger', sticky: false } }}
        sections={defaultSiteConfig.pages[0].sections}
        artistSlug="luna-vega"
      />,
    )
    expect(legacyNav.querySelector('.fixed.bottom-4')).toBeNull()
    const footer = legacyNav.querySelector('footer')
    expect(footer).not.toBeNull()
  })

  it('renders static accessible colophon in SiteFooter when footer disabled and not in preview', () => {
    const { container, rerender } = render(
      <SiteFooter config={defaultSiteConfig} artistSlug="luna-vega" inPreview={false} />,
    )
    const link = screen.getByRole('link', { name: 'Hecho con Quadro' }) as HTMLAnchorElement
    expect(link.style.opacity).toBe('0.72')
    expect(link.style.fontSize).toBe('0.75rem')
    expect(container.querySelector('footer')?.style.position).not.toBe('fixed')

    rerender(<SiteFooter config={defaultSiteConfig} artistSlug="luna-vega" inPreview />)
    expect(container.firstChild).toBeNull()
  })

  it('renders functional EditorialContactForm with encoded mailto and role="status" confirmation', () => {
    const contactSection: SectionConfig = {
      id: 'contact',
      type: 'contact',
      variant: 'form',
      visible: true,
      content: { email: 'marco@ejemplo.com' },
    }
    render(<EditorialContact section={contactSection} config={defaultSiteConfig} />)

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana Pérez' } })
    fireEvent.change(screen.getByLabelText('Mensaje'), { target: { value: 'Interesada en Urbano 01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    const status = screen.getByRole('status')
    expect(status.textContent).toContain('marco@ejemplo.com')

    const mailtoLink = screen.getByRole('link', { name: /abrir en tu cliente de correo/i }) as HTMLAnchorElement
    const href = mailtoLink.getAttribute('href') ?? ''
    expect(href).toContain('mailto:marco@ejemplo.com?subject=')
    expect(href).toContain(encodeURIComponent('Ana Pérez'))
    expect(href).toContain(encodeURIComponent('Interesada en Urbano 01'))
  })
})
