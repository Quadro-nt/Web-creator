/**
 * @jest-environment node
 */
import { describe, it, expect } from '@jest/globals'
import { safeJsonLd } from '../json-ld'
import { generateMetadata as generateSiteMetadata } from '@/app/sites/[artist]/page'
import { generateMetadata as generateArtworkMetadata } from '@/app/sites/[artist]/obras/[slug]/page'

describe('safeJsonLd', () => {
  it('escapes HTML-sensitive characters to prevent script tag breakout', () => {
    const serialized = safeJsonLd({
      name: '</script><script>alert("xss")</script>',
      note: 'A & B > C',
    })
    expect(serialized).not.toContain('<')
    expect(serialized).not.toContain('>')
    expect(serialized).not.toContain('&')
    expect(serialized).toContain('\\u003c/script\\u003e')
    expect(serialized).toContain('\\u0026')
  })
})

describe('SEO generateMetadata for artist sites and artworks', () => {
  it('returns openGraph title, description, and image for published artist site', async () => {
    const meta = await generateSiteMetadata({ params: { artist: 'luna-vega' } })
    expect(meta.title).toBe('Luna Vega — Arte')
    expect(meta.description).toContain('Luna Vega')
    expect(meta.openGraph).toMatchObject({
      title: 'Luna Vega — Arte',
      type: 'website',
      images: [{ url: 'https://picsum.photos/seed/luna-og/1200/630' }],
    })
  })

  it('returns openGraph title, description, and artwork image for artwork detail page', async () => {
    const meta = await generateArtworkMetadata({
      params: { artist: 'luna-vega', slug: 'formas-01' },
    })
    expect(meta.title).toBe('Luna Vega — Arte — Amanecer en el patio')
    expect(meta.description).toContain('Estudio en tonos cálidos')
    expect(meta.openGraph).toMatchObject({
      title: 'Luna Vega — Arte — Amanecer en el patio',
      type: 'article',
      images: [{ url: 'https://picsum.photos/seed/luna-1/800/1000' }],
    })
  })
})
