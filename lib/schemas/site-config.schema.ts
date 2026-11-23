import { z } from 'zod'
import { FONT_FAMILY_NAMES } from '@/lib/tokens/font-catalog'

const SAFE_UPLOAD_PATH_RE = /^\/uploads\/[a-z0-9-]+\/[a-zA-Z0-9._-]+$/

export const mediaUrlSchema = z.union([
  z
    .string()
    .url()
    .refine((v) => /^https?:\/\//i.test(v), 'La URL debe usar http o https'),
  z
    .string()
    .regex(SAFE_UPLOAD_PATH_RE, 'Ruta de imagen subida inválida')
    .refine((v) => !v.includes('..'), 'Ruta de imagen inválida'),
])

export const SECTION_TYPES = [
  'cover',
  'artworks',
  'bio',
  'exhibitions',
  'contact',
  'featured-work',
  'statement',
  'gallery',
  'press',
  'video',
  'cta',
  'divider',
  'marquee',
  'category-grid',
  'feature-split',
  'social-strip',
  'reviews',
  'newsletter',
] as const

export type SectionType = (typeof SECTION_TYPES)[number]

export const SectionStyleSchema = z.object({
  colorScheme: z.enum(['default', 'dark', 'accent', 'soft']).optional(),
  framed: z.boolean().optional(),
  padding: z.enum(['sm', 'md', 'lg']).optional(),
})

export type SectionStyleConfig = z.infer<typeof SectionStyleSchema>

const SectionConfigSchema = z.object({
  id: z.string(),
  type: z.enum(SECTION_TYPES),
  variant: z.string(),
  visible: z.boolean(),
  content: z.record(z.unknown()),
  style: SectionStyleSchema.optional(),
})

export type SectionConfig = z.infer<typeof SectionConfigSchema>

export const AnnouncementBarSchema = z.object({
  enabled: z.boolean(),
  backgroundColor: z.string(),
  textColor: z.string(),
  messages: z.array(z.string()),
  autoRotate: z.boolean().optional(),
  linkUrl: z.string().optional(),
})

export type AnnouncementBarConfig = z.infer<typeof AnnouncementBarSchema>

export const NavLinkItemSchema = z.object({
  label: z.string(),
  href: z.string(),
})

export const HeaderConfigSchema = z.object({
  layout: z.enum(['left', 'centered', 'minimal']),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  transparentOverCover: z.boolean().optional(),
  logoHeight: z.enum(['sm', 'md', 'lg']).optional(),
  uppercaseLinks: z.boolean().optional(),
  showSearchIcon: z.boolean().optional(),
  showWhatsappIcon: z.boolean().optional(),
  whatsappNumber: z.string().optional(),
  instagramHandle: z.string().optional(),
  customLinks: z.array(NavLinkItemSchema).optional(),
})

export type HeaderConfig = z.infer<typeof HeaderConfigSchema>

export const FooterConfigSchema = z.object({
  enabled: z.boolean(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  bio: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  pinterest: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  quickLinks: z.array(NavLinkItemSchema).optional(),
  copyrightText: z.string().optional(),
})

export type FooterConfig = z.infer<typeof FooterConfigSchema>

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
    headingFont: z.enum(FONT_FAMILY_NAMES).optional(),
    bodyFont: z.enum(FONT_FAMILY_NAMES).optional(),
    uppercaseHeadings: z.boolean().optional(),
    headingTracking: z.enum(['tight', 'normal', 'wide']).optional(),
    borderRadius: z.enum(['none', 'sm', 'md', 'lg']).optional(),
    cardBorder: z.boolean().optional(),
    secondaryBg: z.string().optional(),
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

  announcementBar: AnnouncementBarSchema.optional(),
  header: HeaderConfigSchema.optional(),
  footer: FooterConfigSchema.optional(),

  sections: z.array(SectionConfigSchema),

  identity: z.object({
    siteTitle: z.string().min(1).max(80),
    logoUrl: mediaUrlSchema.optional(),
    signatureUrl: mediaUrlSchema.optional(),
    faviconUrl: mediaUrlSchema.optional(),
    coverImageUrl: mediaUrlSchema.optional(),
    ogImageUrl: mediaUrlSchema.optional(),
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
