import { z } from 'zod'

const SectionConfigSchema = z.object({
  id: z.string(),
  type: z.enum(['cover', 'artworks', 'bio', 'exhibitions', 'contact']),
  variant: z.string(),
  visible: z.boolean(),
  content: z.record(z.unknown()),
})

export const SiteConfigSchema = z.object({
  template: z.enum(['minimal-gallery', 'editorial', 'immersive']),

  styleTokens: z.object({
    background: z.string(),
    text: z.string(),
    accent: z.string(),
    fontPair: z.enum([
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
    ]),
    spacing: z.enum(['compact', 'normal', 'spacious']),
    artworkTreatment: z.enum(['frame', 'margin', 'bleed']),
  }),

  button: z.object({
    shape: z.enum(['square', 'rounded', 'pill']),
    style: z.enum(['filled', 'outlined', 'text']),
    buyText: z.string().min(1).max(40),
  }),

  sizes: z.object({
    typeScale: z.enum(['small', 'medium', 'large']),
    artworkSize: z.enum(['small', 'medium', 'large']),
    columns: z.enum(['2', '3', '4']),
    contentWidth: z.enum(['narrow', 'mid', 'full']),
  }),

  animations: z.object({
    scrollReveal: z.enum(['none', 'soft', 'bold']),
    hoverEffect: z.enum(['zoom', 'info', 'none']),
    pageTransition: z.enum(['none', 'fade']),
  }),

  navigation: z.object({
    type: z.enum(['top', 'side', 'hamburger']),
    sticky: z.boolean(),
  }),

  sections: z.array(SectionConfigSchema),

  identity: z.object({
    siteTitle: z.string().min(1).max(80),
    logoUrl: z.string().url().optional(),
    signatureUrl: z.string().url().optional(),
    faviconUrl: z.string().url().optional(),
    coverImageUrl: z.string().url().optional(),
    ogImageUrl: z.string().url().optional(),
  }),
})

export type SiteConfig = z.infer<typeof SiteConfigSchema>

export const defaultSiteConfig: SiteConfig = {
  template: 'minimal-gallery',

  styleTokens: {
    background: '#ffffff',
    text: '#1a1a1a',
    accent: '#c47a3a',
    fontPair: 'playfair-raleway',
    spacing: 'normal',
    artworkTreatment: 'margin',
  },

  button: {
    shape: 'rounded',
    style: 'filled',
    buyText: 'Consultar precio',
  },

  sizes: {
    typeScale: 'medium',
    artworkSize: 'medium',
    columns: '3',
    contentWidth: 'mid',
  },

  animations: {
    scrollReveal: 'soft',
    hoverEffect: 'info',
    pageTransition: 'fade',
  },

  navigation: {
    type: 'top',
    sticky: true,
  },

  sections: [
    { id: 'cover', type: 'cover', variant: 'fullscreen', visible: true, content: {} },
    { id: 'artworks', type: 'artworks', variant: 'grid', visible: true, content: {} },
    { id: 'bio', type: 'bio', variant: 'split', visible: true, content: {} },
    { id: 'exhibitions', type: 'exhibitions', variant: 'list', visible: false, content: {} },
    { id: 'contact', type: 'contact', variant: 'simple', visible: true, content: {} },
  ],

  identity: {
    siteTitle: 'Mi Sitio de Arte',
  },
}
