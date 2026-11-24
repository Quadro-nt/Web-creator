import { afterEach, describe, expect, it } from '@jest/globals'
import { isAllowedMediaUrl, mediaUrlSchema } from '../site-config.schema'

describe('isAllowedMediaUrl & mediaUrlSchema', () => {
  const originalSupabaseHost = process.env.NEXT_PUBLIC_SUPABASE_MEDIA_HOST
  const originalMediaHost = process.env.NEXT_PUBLIC_MEDIA_HOST

  afterEach(() => {
    if (originalSupabaseHost === undefined) {
      delete process.env.NEXT_PUBLIC_SUPABASE_MEDIA_HOST
    } else {
      process.env.NEXT_PUBLIC_SUPABASE_MEDIA_HOST = originalSupabaseHost
    }

    if (originalMediaHost === undefined) {
      delete process.env.NEXT_PUBLIC_MEDIA_HOST
    } else {
      process.env.NEXT_PUBLIC_MEDIA_HOST = originalMediaHost
    }
  })

  it('acepta rutas locales seguras /uploads/<slug>/<file> y rechaza path traversal', () => {
    expect(isAllowedMediaUrl('/uploads/luna-vega/obra-1.jpg')).toBe(true)
    expect(mediaUrlSchema.safeParse('/uploads/luna-vega/obra-1.jpg').success).toBe(true)

    const invalidLocalPaths = [
      '/uploads/luna-vega/../secret.jpg',
      '/uploads/../secret.jpg',
      '/uploads/luna-vega/sub/obra-1.jpg',
      '/public/luna-vega/obra-1.jpg',
    ]

    for (const path of invalidLocalPaths) {
      expect(isAllowedMediaUrl(path)).toBe(false)
      expect(mediaUrlSchema.safeParse(path).success).toBe(false)
    }
  })

  it('acepta URLs válidas de Supabase Storage y rechaza rutas inválidas en supabase.co', () => {
    const validSupabaseUrl =
      'https://xyzproject.supabase.co/storage/v1/object/public/artist-media/luna-vega/123.webp'

    expect(isAllowedMediaUrl(validSupabaseUrl)).toBe(true)
    expect(mediaUrlSchema.safeParse(validSupabaseUrl).success).toBe(true)

    const invalidSupabaseUrls = [
      'https://xyzproject.supabase.co/storage/v1/object/public/artist-media/../secret.webp',
      'https://xyzproject.supabase.co/storage/v1/object/public/artist-media/%2e%2e/secret.webp',
      'https://xyzproject.supabase.co/storage/v1/object/public/',
      'https://xyzproject.supabase.co/rest/v1/artists',
    ]

    for (const url of invalidSupabaseUrls) {
      expect(isAllowedMediaUrl(url)).toBe(false)
      expect(mediaUrlSchema.safeParse(url).success).toBe(false)
    }
  })

  it('acepta URLs HTTPS externas válidas como cdn.quadro-nt.com y http solo para localhost/127.0.0.1', () => {
    const validUrls = [
      'https://cdn.quadro-nt.com/artists/luna-vega/obra-1.webp',
      'https://picsum.photos/seed/luna-1/800/1000',
      'http://localhost:3000/uploads/luna-vega/obra-1.jpg',
      'http://127.0.0.1:54321/storage/v1/object/public/artist-media/1.png',
    ]

    for (const url of validUrls) {
      expect(isAllowedMediaUrl(url)).toBe(true)
      expect(mediaUrlSchema.safeParse(url).success).toBe(true)
    }

    expect(isAllowedMediaUrl('http://cdn.quadro-nt.com/obra-1.webp')).toBe(false)
    expect(mediaUrlSchema.safeParse('http://cdn.quadro-nt.com/obra-1.webp').success).toBe(false)
  })

  it('permite hosts configurados en NEXT_PUBLIC_SUPABASE_MEDIA_HOST o NEXT_PUBLIC_MEDIA_HOST', () => {
    process.env.NEXT_PUBLIC_SUPABASE_MEDIA_HOST = 'media-proxy.supabase.co'
    process.env.NEXT_PUBLIC_MEDIA_HOST = 'assets.quadro-nt.com'

    expect(isAllowedMediaUrl('https://media-proxy.supabase.co/custom/path/123.webp')).toBe(true)
    expect(isAllowedMediaUrl('https://assets.quadro-nt.com/obras/obra-1.jpg')).toBe(true)
  })

  it('rechaza esquemas peligrosos, cadenas vacías, URLs malformadas y path traversal', () => {
    const rejectedInputs = [
      '',
      '   ',
      'javascript:alert(1)',
      'JAVASCRIPT:alert(1)',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
      'vbscript:msgbox(1)',
      'ftp://cdn.quadro-nt.com/obra.jpg',
      'not-a-valid-url',
      'https://cdn.quadro-nt.com/artists/../secret.jpg',
      'https://cdn.quadro-nt.com/artists/%2e%2e/secret.jpg',
      'https://user:pass@cdn.quadro-nt.com/obra.jpg',
      'https://cdn.quadro-nt.com/obra.jpg?q=<script>',
    ]

    for (const input of rejectedInputs) {
      expect(isAllowedMediaUrl(input)).toBe(false)
      expect(mediaUrlSchema.safeParse(input).success).toBe(false)
    }
  })
})
