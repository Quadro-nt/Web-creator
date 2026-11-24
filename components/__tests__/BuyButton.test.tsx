import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { BuyButton } from '../BuyButton'
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
const ORIGINAL_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

describe('BuyButton', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = '51999000000'
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = ORIGINAL_WHATSAPP
    process.env.NEXT_PUBLIC_BASE_URL = ORIGINAL_BASE_URL
  })

  it('renders the button with an href containing wa.me when the artwork is not sold', () => {
    render(<BuyButton artwork={baseArtwork} artistSlug="luna-vega" />)
    const link = screen.getByText('Comprar via WhatsApp') as HTMLAnchorElement
    expect(link.tagName.toLowerCase()).toBe('a')
    expect(link.getAttribute('href')).toContain('wa.me')
  })

  it('includes the artwork title in the prebuilt WhatsApp message', () => {
    render(<BuyButton artwork={baseArtwork} artistSlug="luna-vega" />)
    const link = screen.getByText('Comprar via WhatsApp') as HTMLAnchorElement
    const href = link.getAttribute('href') ?? ''
    expect(decodeURIComponent(href)).toContain(baseArtwork.title)
  })

  it('renders nothing when the artwork is sold', () => {
    const sold: Artwork = { ...baseArtwork, sold: true }
    const { container } = render(<BuyButton artwork={sold} artistSlug="luna-vega" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when NEXT_PUBLIC_WHATSAPP_NUMBER is not configured', () => {
    delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
    const { container } = render(<BuyButton artwork={baseArtwork} artistSlug="luna-vega" />)
    expect(container.firstChild).toBeNull()
  })

  describe('with SiteConfig', () => {
    it('uses config button shape, style, buyText and header whatsappNumber', () => {
      delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
      const config: SiteConfig = {
        ...defaultSiteConfig,
        button: { shape: 'square', style: 'outlined', buyText: 'Adquirir obra' },
        header: { layout: 'left', whatsappNumber: '+51 987-654-321' },
      }
      render(<BuyButton artwork={baseArtwork} artistSlug="luna-vega" config={config} />)
      const link = screen.getByText('Adquirir obra') as HTMLAnchorElement
      expect(link.getAttribute('data-shape')).toBe('square')
      expect(link.getAttribute('data-style')).toBe('outlined')
      expect(link.getAttribute('href')).toContain('https://wa.me/51987654321?text=')
    })

    it('falls back through footer.whatsapp, contact section, and env var', () => {
      delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
      const footerConfig: SiteConfig = {
        ...defaultSiteConfig,
        footer: { enabled: true, whatsapp: '51 911 222 333' },
      }
      const { unmount } = render(
        <BuyButton artwork={baseArtwork} artistSlug="luna-vega" config={footerConfig} />,
      )
      expect(screen.getByRole('link').getAttribute('href')).toContain('https://wa.me/51911222333?')
      unmount()

      const contactConfig: SiteConfig = {
        ...defaultSiteConfig,
        sections: [
          {
            id: 'contact',
            type: 'contact',
            variant: 'simple',
            visible: true,
            content: { whatsapp: '+51 944 555 666' },
          },
        ],
      }
      render(<BuyButton artwork={baseArtwork} artistSlug="luna-vega" config={contactConfig} />)
      expect(screen.getByRole('link').getAttribute('href')).toContain('https://wa.me/51944555666?')
    })

    it('shows "Consultar precio" when artwork has no price', () => {
      const { price: _omitted, ...noPriceArtwork } = baseArtwork
      const config: SiteConfig = {
        ...defaultSiteConfig,
        button: { shape: 'rounded', style: 'filled', buyText: 'Comprar' },
        header: { layout: 'left', whatsappNumber: '51999000111' },
      }
      render(<BuyButton artwork={noPriceArtwork} artistSlug="luna-vega" config={config} />)
      expect(screen.getByText('Consultar precio')).toBeTruthy()
    })

    it('builds subdomain artwork URL in WhatsApp message from NEXT_PUBLIC_BASE_URL', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://quadro-nt.com'
      const config: SiteConfig = {
        ...defaultSiteConfig,
        header: { layout: 'left', whatsappNumber: '51999000111' },
      }
      render(<BuyButton artwork={baseArtwork} artistSlug="luna-vega" config={config} />)
      const href = screen.getByRole('link').getAttribute('href') ?? ''
      expect(decodeURIComponent(href)).toContain('https://luna-vega.quadro-nt.com/obras/obra-1')
    })

    it('builds localhost subdomain artwork URL when NEXT_PUBLIC_BASE_URL is localhost', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
      const config: SiteConfig = {
        ...defaultSiteConfig,
        header: { layout: 'left', whatsappNumber: '51999000111' },
      }
      render(<BuyButton artwork={baseArtwork} artistSlug="luna-vega" config={config} />)
      const href = screen.getByRole('link').getAttribute('href') ?? ''
      expect(decodeURIComponent(href)).toContain('http://luna-vega.localhost:3000/obras/obra-1')
    })

    it('does not duplicate artist subdomain when NEXT_PUBLIC_BASE_URL already includes it', () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://luna-vega.quadro-nt.com'
      const config: SiteConfig = {
        ...defaultSiteConfig,
        header: { layout: 'left', whatsappNumber: '51999000111' },
      }
      render(<BuyButton artwork={baseArtwork} artistSlug="luna-vega" config={config} />)
      const href = screen.getByRole('link').getAttribute('href') ?? ''
      expect(decodeURIComponent(href)).toContain('https://luna-vega.quadro-nt.com/obras/obra-1')
    })
  })
})
