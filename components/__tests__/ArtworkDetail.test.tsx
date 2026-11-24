import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { ArtworkDetail } from '../ArtworkDetail'
import type { Artwork } from '@/lib/schemas/works.schema'
import { defaultSiteConfig, type SiteConfig } from '@/lib/schemas/site-config.schema'

const baseArtwork: Artwork = {
  slug: 'obra-1',
  title: 'Noche de luna',
  year: 2023,
  medium: 'oleo sobre lienzo',
  dimensions: '80 x 100 cm',
  price: 1200,
  currency: 'PEN',
  sold: false,
  images: ['https://example.com/obra-1.jpg'],
  tags: [],
}

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

  it('renders a back link to portfolio and applies qs-split-responsive to the grid', () => {
    const { container } = render(
      <ArtworkDetail artwork={baseArtwork} artistSlug="luna-vega" config={defaultSiteConfig} />,
    )
    const backLink = screen.getByText('← Volver al portafolio') as HTMLAnchorElement
    expect(backLink.tagName.toLowerCase()).toBe('a')
    expect(backLink.getAttribute('href')).toBe('/')

    const mainGrid = container.querySelector('main.qs-split-responsive')
    expect(mainGrid).not.toBeNull()
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
