import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ArtworkDetail } from '../ArtworkDetail'
import type { Artwork } from '@/lib/schemas/works.schema'
import { defaultSiteConfig, type SiteConfig } from '@/lib/schemas/site-config.schema'

const baseArtwork: Artwork = {
  slug: 'obra-1',
  title: 'Noche de luna',
  year: 2023,
  medium: 'óleo sobre lienzo',
  dimensions: '80 x 100 cm',
  price: 1200,
  currency: 'PEN',
  sold: false,
  images: ['https://example.com/obra-1.jpg'],
  tags: [],
}

const catalogWorks: Artwork[] = [
  baseArtwork,
  {
    slug: 'obra-2',
    title: 'Aurora boreal',
    year: 2024,
    medium: 'acrílico sobre tela',
    dimensions: '100 x 120 cm',
    price: 1800,
    currency: 'PEN',
    sold: false,
    images: ['https://example.com/obra-2.jpg'],
    tags: [],
  },
  {
    slug: 'obra-3',
    title: 'Bruma nocturna',
    year: 2022,
    medium: 'técnica mixta',
    dimensions: '70 x 90 cm',
    price: 950,
    currency: 'PEN',
    sold: true,
    images: ['https://example.com/obra-3.jpg'],
    tags: [],
  },
]

const ORIGINAL_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

describe('ArtworkDetail', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = ORIGINAL_WHATSAPP
  })

  it('injects CSS token styles and wraps content in .qs-site-root when config is provided', () => {
    const config: SiteConfig = {
      ...defaultSiteConfig,
      styleTokens: {
        ...defaultSiteConfig.styleTokens,
        background: '#111111',
        text: '#f5f5f5',
      },
    }
    const { container } = render(
      <ArtworkDetail artwork={baseArtwork} artistSlug="luna-vega" config={config} />,
    )
    const root = container.querySelector('.qs-site-root') as HTMLElement | null
    expect(root).not.toBeNull()
    expect(root?.style.minHeight).toBe('100vh')

    const styleEl = root?.querySelector('style')
    expect(styleEl?.textContent).toContain('.qs-site-root')
    expect(styleEl?.textContent).toContain('--color-bg: #111111')
    expect(styleEl?.textContent).toContain('@container qs-canvas')
  })

  it('renders a SafeLink back to portfolio and applies qs-split-responsive to the grid', () => {
    const { container } = render(
      <ArtworkDetail artwork={baseArtwork} artistSlug="luna-vega" config={defaultSiteConfig} />,
    )
    const backLink = screen.getByText('← Volver al portafolio') as HTMLAnchorElement
    expect(backLink.tagName.toLowerCase()).toBe('a')
    expect(backLink.getAttribute('href')).toBe('/sites/luna-vega')

    const mainGrid = container.querySelector('main.qs-split-responsive')
    expect(mainGrid).not.toBeNull()

    expect(screen.getByText('Año')).toBeTruthy()
    expect(screen.getByText('Técnica')).toBeTruthy()
  })

  it('renders AnnouncementBar, SiteHeader, and SiteFooter when configured', () => {
    const config: SiteConfig = {
      ...defaultSiteConfig,
      announcementBar: {
        enabled: true,
        backgroundColor: '#ec9fbf',
        textColor: '#4b0303',
        messages: ['Nueva exposición abierta'],
      },
      header: {
        layout: 'left',
        whatsappNumber: '51999000111',
      },
      footer: {
        enabled: true,
        copyrightText: '© 2026 Luna Vega',
      },
    }

    render(<ArtworkDetail artwork={baseArtwork} artistSlug="luna-vega" config={config} />)

    expect(screen.getByText('Nueva exposición abierta')).toBeTruthy()
    const header = screen.getByRole('banner')
    expect(within(header).getAllByText(defaultSiteConfig.identity.siteTitle).length).toBeGreaterThanOrEqual(1)
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByText('© 2026 Luna Vega')).toBeTruthy()
  })

  it('renders prev/next links and related works row with SafeLink when relatedWorks is provided', () => {
    render(
      <ArtworkDetail
        artwork={catalogWorks[1]}
        artistSlug="luna-vega"
        config={defaultSiteConfig}
        relatedWorks={catalogWorks}
      />,
    )

    const prevLink = screen.getByRole('link', { name: /Obra anterior: Noche de luna/i })
    expect(prevLink.getAttribute('href')).toBe('/sites/luna-vega/obras/obra-1')

    const nextLink = screen.getByRole('link', { name: /Obra siguiente: Bruma nocturna/i })
    expect(nextLink.getAttribute('href')).toBe('/sites/luna-vega/obras/obra-3')

    const moreHeading = screen.getByRole('heading', { name: 'Más obras del catálogo' })
    const moreSection = moreHeading.closest('section')!
    const relatedLink = within(moreSection).getByRole('link', { name: /Bruma nocturna/i })
    expect(relatedLink.getAttribute('href')).toBe('/sites/luna-vega/obras/obra-3')
  })

  it('supports opening lightbox HD and room view from ArtworkDetail', () => {
    render(
      <ArtworkDetail artwork={baseArtwork} artistSlug="luna-vega" config={defaultSiteConfig} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ampliar obra' }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Ver en sala' }))
    expect(screen.getByText(/Pared de referencia: 260 cm/i)).toBeTruthy()
  })

  it('renders BuyButton and "Consultar precio" when artwork has no price and is not sold', () => {
    const { price: _omitted, ...noPriceArtwork } = baseArtwork
    const config: SiteConfig = {
      ...defaultSiteConfig,
      header: { layout: 'left', whatsappNumber: '51999000111' },
    }
    render(<ArtworkDetail artwork={noPriceArtwork} artistSlug="luna-vega" config={config} />)

    const buyLink = screen.getByRole('link', { name: 'Consultar precio' }) as HTMLAnchorElement
    expect(buyLink.getAttribute('href')).toContain('https://wa.me/51999000111')
    expect(screen.getAllByText('Consultar precio').length).toBeGreaterThanOrEqual(1)
  })

  it('still shows "Consultar precio" when artwork has no price and no WhatsApp number is set', () => {
    const { price: _omitted, ...noPriceArtwork } = baseArtwork
    render(
      <ArtworkDetail artwork={noPriceArtwork} artistSlug="luna-vega" config={defaultSiteConfig} />,
    )
    expect(screen.getByText('Consultar precio')).toBeTruthy()
  })

  it('shows "Vendida" and omits BuyButton when artwork is sold', () => {
    const soldArtwork: Artwork = { ...baseArtwork, sold: true }
    const config: SiteConfig = {
      ...defaultSiteConfig,
      header: { layout: 'left', whatsappNumber: '51999000111' },
    }
    render(<ArtworkDetail artwork={soldArtwork} artistSlug="luna-vega" config={config} />)
    expect(screen.getByText('Vendida')).toBeTruthy()
    expect(screen.queryByRole('link', { name: /wa\.me|Consultar|Comprar/i })).toBeNull()
  })
})
