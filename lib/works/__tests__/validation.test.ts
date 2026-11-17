import { describe, it, expect } from '@jest/globals'
import { ArtworkSchema } from '@/lib/schemas/works.schema'

const validArtwork = {
  slug: 'formas-01',
  title: 'Formas en azul',
  year: 2023,
  medium: 'oleo sobre lienzo',
  dimensions: '80 x 100 cm',
  images: ['https://example.com/formas-01.jpg'],
  tags: [],
}

describe('ArtworkSchema — validation', () => {
  it('artwork with all required fields passes', () => {
    const result = ArtworkSchema.safeParse(validArtwork)
    expect(result.success).toBe(true)
  })

  it('artwork without slug fails', () => {
    const { slug: _slug, ...noSlug } = validArtwork
    const result = ArtworkSchema.safeParse(noSlug)
    expect(result.success).toBe(false)
  })

  it('artwork with empty images array fails (minimum 1 image required)', () => {
    const result = ArtworkSchema.safeParse({ ...validArtwork, images: [] })
    expect(result.success).toBe(false)
  })

  it('artwork with negative price fails', () => {
    const result = ArtworkSchema.safeParse({ ...validArtwork, price: -100 })
    expect(result.success).toBe(false)
  })

  it('artwork with currency EUR fails (only PEN and USD are valid)', () => {
    const result = ArtworkSchema.safeParse({ ...validArtwork, currency: 'EUR' })
    expect(result.success).toBe(false)
  })

  it('artwork without sold field passes and defaults to false', () => {
    const result = ArtworkSchema.safeParse(validArtwork)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sold).toBe(false)
    }
  })
})
