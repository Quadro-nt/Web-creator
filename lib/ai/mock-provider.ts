import type { SectionConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import type { AIProvider, AIResponse } from './provider'

export class MockProvider implements AIProvider {
  async suggestConfig(params: {
    currentConfig: SiteConfig
    prompt: string
    schema: string
  }): Promise<AIResponse> {
    const prompt = params.prompt.toLowerCase()

    if (prompt.includes('error') || prompt.includes('invalido') || prompt.includes('inválido')) {
      const invalid = {
        ...params.currentConfig,
        template: 'inexistente',
      }
      return {
        newConfig: invalid,
        explanation: 'Intento de cambio de template',
        unsatisfied: [],
      }
    }

    if (prompt.includes('imposible')) {
      return {
        newConfig: params.currentConfig,
        explanation: 'No se realizó ningún cambio',
        unsatisfied: ['Esta solicitud no puede cumplirse dentro del esquema de diseno'],
      }
    }

    const next = JSON.parse(JSON.stringify(params.currentConfig)) as SiteConfig
    const changes: string[] = []

    if (prompt.includes('pop')) {
      next.styleTokens.headingFont = 'Bagel Fat One'
      next.styleTokens.bodyFont = 'Barlow Condensed'
      next.styleTokens.uppercaseHeadings = true
      next.styleTokens.borderRadius = 'lg'
      next.styleTokens.cardBorder = true
      next.styleTokens.accent = '#d73578'
      next.announcementBar = {
        enabled: true,
        backgroundColor: '#ec9fbf',
        textColor: '#4b0303',
        messages: ['NUEVA COLECCIÓN DISPONIBLE', 'ENVÍO GRATIS EN OBRAS ORIGINALES'],
        autoRotate: true,
      }
      next.header = {
        layout: 'centered',
        backgroundColor: '#000000',
        textColor: '#ffffff',
        logoHeight: 'md',
        uppercaseLinks: true,
        showSearchIcon: true,
      }
      changes.push('estilo Pop Studio con barra de anuncios y header centrado')
    } else if (prompt.includes('header negro')) {
      next.header = {
        ...(next.header ?? { layout: 'centered' }),
        backgroundColor: '#000000',
        textColor: '#ffffff',
      }
      changes.push('header negro con texto blanco')
    }

    if (
      prompt.includes('oscuro') ||
      prompt.includes('dark') ||
      (prompt.includes('negro') && !prompt.includes('header negro'))
    ) {
      next.styleTokens.background = '#0d0d0d'
      next.styleTokens.text = '#f2f0ec'
      next.styleTokens.accent = '#e2be53'
      changes.push('paleta oscura de alto contraste')
    } else if (prompt.includes('blanco') || prompt.includes('claro')) {
      next.styleTokens.background = '#ffffff'
      next.styleTokens.text = '#1a1a1a'
      changes.push('fondo blanco galería')
    }

    if (prompt.includes('editorial')) {
      next.template = 'editorial'
      changes.push('template Editorial')
    } else if (prompt.includes('inmersiv')) {
      next.template = 'immersive'
      changes.push('template Immersive')
    } else if (prompt.includes('minimal')) {
      const targetMatch = params.prompt.match(/\[Sección seleccionada:\s*([^\]]+)\]/)
      if (targetMatch) {
        const idx = next.sections.findIndex((s) => s.id === targetMatch[1].trim())
        if (idx >= 0 && next.sections[idx].type === 'cover') {
          next.sections[idx] = { ...next.sections[idx], variant: 'minimal' }
          changes.push('portada en variante minimal')
        }
      } else {
        next.template = 'minimal-gallery'
        changes.push('template Minimal Gallery')
      }
    }

    if (prompt.includes('2 columnas')) {
      next.sizes.columns = '2'
      changes.push('grilla de 2 columnas')
    } else if (prompt.includes('4 columnas')) {
      next.sizes.columns = '4'
      changes.push('grilla de 4 columnas')
    }

    if (prompt.includes('amplio')) {
      next.styleTokens.spacing = 'spacious'
      changes.push('espaciado amplio')
    } else if (prompt.includes('compacto')) {
      next.styleTokens.spacing = 'compact'
      changes.push('espaciado compacto')
    }

    const addSection = (section: SectionConfig, label: string) => {
      next.sections.push(section)
      changes.push(`se agregó módulo ${label}`)
    }

    const uid = () => `ai-${Date.now().toString(36)}`
    if (prompt.includes('encargo') || prompt.includes('cta')) {
      addSection(
        {
          id: uid(),
          type: 'cta',
          variant: 'banner',
          visible: true,
          content: {
            title: '¿Buscas una obra a medida?',
            description: 'Conversamos sobre formato, paleta y plazos.',
            buttonText: 'Consultar por encargo',
          },
        },
        'Encargos / CTA'
      )
    } else if (prompt.includes('manifiesto') || prompt.includes('cita')) {
      addSection(
        {
          id: uid(),
          type: 'statement',
          variant: 'centered',
          visible: true,
          content: {
            eyebrow: 'Declaración',
            quote: 'La materia y la luz dialogan hasta encontrar su equilibrio silencioso.',
          },
        },
        'Manifiesto / Cita'
      )
    } else if (prompt.includes('video')) {
      addSection(
        {
          id: uid(),
          type: 'video',
          variant: 'wide',
          visible: true,
          content: { title: 'Recorrido de estudio', url: '' },
        },
        'Video'
      )
    } else if (prompt.includes('prensa')) {
      addSection(
        {
          id: uid(),
          type: 'press',
          variant: 'list',
          visible: true,
          content: { title: 'Prensa y reconocimientos', items: [] },
        },
        'Prensa'
      )
    } else if (prompt.includes('obra destacada')) {
      addSection(
        {
          id: uid(),
          type: 'featured-work',
          variant: 'split',
          visible: true,
          content: { eyebrow: 'Obra destacada' },
        },
        'Obra destacada'
      )
    } else if (prompt.includes('cinta') || prompt.includes('marquee')) {
      addSection(
        {
          id: uid(),
          type: 'marquee',
          variant: 'pills',
          visible: true,
          content: {
            items: ['OBRAS ORIGINALES', 'EDICIONES LIMITADAS'],
            angle: '-2',
            pillBg: '#ec9fbf',
            pillText: '#4b0303',
          },
        },
        'Cinta animada'
      )
    } else if (prompt.includes('newsletter') || prompt.includes('club')) {
      addSection(
        {
          id: uid(),
          type: 'newsletter',
          variant: 'framed',
          visible: true,
          content: {
            heading: 'ÚNETE AL CLUB DEL TALLER',
            description: 'Recibe acceso anticipado a nuevas obras y exhibiciones.',
            buttonText: 'Suscribirme',
          },
        },
        'Newsletter'
      )
    } else if (prompt.includes('reseña') || prompt.includes('review')) {
      addSection(
        {
          id: uid(),
          type: 'reviews',
          variant: 'cards',
          visible: true,
          content: {
            title: 'RESEÑAS',
            items: [{ author: 'Coleccionista', quote: 'Obra excepcional y envío impecable.', rating: 5 }],
          },
        },
        'Reseñas'
      )
    } else if (prompt.includes('coleccion')) {
      addSection(
        {
          id: uid(),
          type: 'category-grid',
          variant: 'overlay',
          visible: true,
          content: {
            columns: '2',
            cards: [
              { title: 'ORIGINALES', ctaLabel: 'VER COLECCIÓN', imageUrl: 'https://picsum.photos/seed/cat-1/900/700' },
              { title: 'PRINTS', ctaLabel: 'VER COLECCIÓN', imageUrl: 'https://picsum.photos/seed/cat-2/900/700' },
            ],
          },
        },
        'Tarjetas de colecciones'
      )
    } else if (prompt.includes('taller') || prompt.includes('galer')) {
      addSection(
        {
          id: uid(),
          type: 'gallery',
          variant: 'grid',
          visible: true,
          content: { title: 'En el taller', images: [] },
        },
        'Galería de taller'
      )
    }

    if (changes.length > 0) {
      return {
        newConfig: next,
        explanation: `Se aplicó: ${changes.join(', ')}`,
        unsatisfied: [],
      }
    }

    const updated: SiteConfig = {
      ...params.currentConfig,
      styleTokens: {
        ...params.currentConfig.styleTokens,
        background: '#f5f5f5',
      },
    }
    return {
      newConfig: updated,
      explanation: 'Se cambio el fondo a gris claro',
      unsatisfied: [],
    }
  }
}
