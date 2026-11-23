import { describe, it, expect } from '@jest/globals'
import { SECTION_TYPES, SiteConfigSchema, defaultSiteConfig } from '../site-config.schema'
import { ArtworkSchema } from '../works.schema'

describe('SiteConfigSchema — 12 módulos y media URLs', () => {
  it('acepta los 18 tipos de sección definidos', () => {
    const config = {
      ...defaultSiteConfig,
      sections: SECTION_TYPES.map((type, idx) => ({
        id: `sec-${idx}`,
        type,
        variant: 'default',
        visible: true,
        content: {},
        style: { colorScheme: 'soft' as const, framed: true, padding: 'md' as const },
      })),
    }

    const result = SiteConfigSchema.safeParse(config)
    expect(result.success).toBe(true)
    expect(SECTION_TYPES).toHaveLength(18)
  })

  it('acepta announcementBar, header, footer y tipografías extendidas', () => {
    const config = {
      ...defaultSiteConfig,
      styleTokens: {
        ...defaultSiteConfig.styleTokens,
        headingFont: 'Bagel Fat One' as const,
        bodyFont: 'Barlow Condensed' as const,
        uppercaseHeadings: true,
        headingTracking: 'wide' as const,
        borderRadius: 'lg' as const,
        cardBorder: true,
        secondaryBg: '#ec9fbf',
      },
      announcementBar: {
        enabled: true,
        backgroundColor: '#ec9fbf',
        textColor: '#4b0303',
        messages: ['Nueva colección'],
        autoRotate: true,
      },
      header: {
        layout: 'centered' as const,
        backgroundColor: '#000000',
        textColor: '#ffffff',
        showSearchIcon: true,
      },
      footer: {
        enabled: true,
        backgroundColor: '#000000',
        textColor: '#ffffff',
        bio: 'Estudio independiente',
      },
    }

    expect(SiteConfigSchema.safeParse(config).success).toBe(true)
  })

  it('acepta rutas relativas seguras /uploads/<slug>/<archivo> en identity', () => {
    const config = {
      ...defaultSiteConfig,
      identity: {
        ...defaultSiteConfig.identity,
        logoUrl: '/uploads/luna-vega/logo-taller.png',
        coverImageUrl: '/uploads/luna-vega/portada.webp',
      },
    }

    expect(SiteConfigSchema.safeParse(config).success).toBe(true)
  })

  it('rechaza path traversal o esquemas inseguros en media URLs', () => {
    const invalidPaths = [
      '/uploads/../secret.png',
      '/uploads/luna-vega/../secret.png',
      '/uploads/luna-vega/sub/img.png',
      'javascript:alert(1)',
    ]

    for (const badPath of invalidPaths) {
      const siteResult = SiteConfigSchema.safeParse({
        ...defaultSiteConfig,
        identity: { ...defaultSiteConfig.identity, coverImageUrl: badPath },
      })
      expect(siteResult.success).toBe(false)

      const workResult = ArtworkSchema.safeParse({
        slug: 'obra-test',
        title: 'Obra test',
        year: 2024,
        medium: 'Óleo',
        dimensions: '50x50',
        images: [badPath],
      })
      expect(workResult.success).toBe(false)
    }
  })

  it('acepta rutas /uploads/<slug>/<archivo> en ArtworkSchema', () => {
    const result = ArtworkSchema.safeParse({
      slug: 'obra-local',
      title: 'Obra local',
      year: 2024,
      medium: 'Acrílico',
      dimensions: '60x80 cm',
      images: ['/uploads/luna-vega/obra-1.jpg'],
    })
    expect(result.success).toBe(true)
  })
})
