import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { BuyButton } from '../BuyButton'
import type { Artwork } from '@/lib/schemas/works.schema'

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
})
