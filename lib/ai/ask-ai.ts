import { SECTION_TYPES, SiteConfigSchema, type SiteConfig } from '@/lib/schemas/site-config.schema'
import type { AIProvider } from './provider'

export type AISuggestion = {
  newConfig: SiteConfig | null
  explanation: string
  unsatisfied: string[]
  validationError: string | null
}

const SCHEMA_SUMMARY = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'SiteConfig',
  type: 'object',
  required: [
    'template',
    'styleTokens',
    'button',
    'sizes',
    'animations',
    'navigation',
    'sections',
    'identity',
  ],
  properties: {
    template: { enum: ['minimal-gallery', 'editorial', 'immersive'] },
    styleTokens: {
      type: 'object',
      required: ['background', 'text', 'accent', 'fontPair', 'spacing', 'artworkTreatment'],
      properties: {
        background: { type: 'string', description: 'color CSS (hex, rgb, nombre)' },
        text: { type: 'string' },
        accent: { type: 'string' },
        fontPair: {
          enum: [
            'playfair-raleway',
            'libre-baskerville-source-sans',
            'cormorant-jost',
            'dm-serif-inter',
            'fraunces-nunito',
            'bodoni-moda-figtree',
            'garamond-lato',
            'merriweather-open-sans',
            'spectral-work-sans',
            'big-caslon-muli',
            'IM-fell-outfit',
            'alice-rubik',
          ],
        },
        spacing: { enum: ['compact', 'normal', 'spacious'] },
        artworkTreatment: { enum: ['frame', 'margin', 'bleed'] },
        headingFont: { type: 'string' },
        bodyFont: { type: 'string' },
        uppercaseHeadings: { type: 'boolean' },
        borderRadius: { enum: ['none', 'sm', 'md', 'lg'] },
        cardBorder: { type: 'boolean' },
      },
    },
    announcementBar: { type: 'object' },
    header: { type: 'object' },
    footer: { type: 'object' },
    button: {
      type: 'object',
      required: ['shape', 'style', 'buyText'],
      properties: {
        shape: { enum: ['square', 'rounded', 'pill'] },
        style: { enum: ['filled', 'outlined', 'text'] },
        buyText: { type: 'string', minLength: 1, maxLength: 40 },
      },
    },
    sizes: {
      type: 'object',
      required: ['typeScale', 'artworkSize', 'columns', 'contentWidth'],
      properties: {
        typeScale: { enum: ['small', 'medium', 'large'] },
        artworkSize: { enum: ['small', 'medium', 'large'] },
        columns: { enum: ['2', '3', '4'] },
        contentWidth: { enum: ['narrow', 'mid', 'full'] },
      },
    },
    animations: {
      type: 'object',
      required: ['scrollReveal', 'hoverEffect', 'pageTransition'],
      properties: {
        scrollReveal: { enum: ['none', 'soft', 'bold'] },
        hoverEffect: { enum: ['zoom', 'info', 'none'] },
        pageTransition: { enum: ['none', 'fade'] },
      },
    },
    navigation: {
      type: 'object',
      required: ['type', 'sticky'],
      properties: {
        type: { enum: ['top', 'side', 'hamburger'] },
        sticky: { type: 'boolean' },
      },
    },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'type', 'variant', 'visible', 'content'],
        properties: {
          id: { type: 'string' },
          type: { enum: [...SECTION_TYPES] },
          variant: { type: 'string' },
          visible: { type: 'boolean' },
          content: { type: 'object' },
        },
      },
    },
    identity: {
      type: 'object',
      required: ['siteTitle'],
      properties: {
        siteTitle: { type: 'string', minLength: 1, maxLength: 80 },
        logoUrl: { type: 'string', format: 'uri' },
        signatureUrl: { type: 'string', format: 'uri' },
        faviconUrl: { type: 'string', format: 'uri' },
        coverImageUrl: { type: 'string', format: 'uri' },
        ogImageUrl: { type: 'string', format: 'uri' },
      },
    },
  },
}

export function getSiteConfigJsonSchema(): string {
  return JSON.stringify(SCHEMA_SUMMARY, null, 2)
}

export async function askAI(params: {
  currentConfig: SiteConfig
  prompt: string
  provider: AIProvider
  selectedSectionId?: string
}): Promise<AISuggestion> {
  const schema = getSiteConfigJsonSchema()
  const contextualPrompt = params.selectedSectionId
    ? `[Sección seleccionada: ${params.selectedSectionId}] ${params.prompt}`
    : params.prompt
  const response = await params.provider.suggestConfig({
    currentConfig: params.currentConfig,
    prompt: contextualPrompt,
    schema,
  })

  const parsed = SiteConfigSchema.safeParse(response.newConfig)
  if (!parsed.success) {
    return {
      newConfig: null,
      explanation: response.explanation,
      unsatisfied: response.unsatisfied,
      validationError: parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; '),
    }
  }

  return {
    newConfig: parsed.data,
    explanation: response.explanation,
    unsatisfied: response.unsatisfied,
    validationError: null,
  }
}
