import { z } from 'zod'
import { FONT_FAMILY_NAMES } from '@/lib/tokens/font-catalog'

const SAFE_UPLOAD_PATH_RE = /^\/uploads\/[a-z0-9-]+\/[a-zA-Z0-9._-]+$/
const SUPABASE_HOST_RE = /^(?:[a-z0-9-]+\.)+supabase\.co$/i
const SUPABASE_PUBLIC_STORAGE_PREFIX = '/storage/v1/object/public/'
const DANGEROUS_SCHEME_RE = /^(?:javascript|data|vbscript):/i
const UNSAFE_MEDIA_CHARS_RE = /[\u0000-\u001f\u007f<>"`{}\\]/
const LOCAL_HTTP_HOSTS = new Set(['localhost', '127.0.0.1'])

function normalizeMediaHost(raw: string | undefined): string | null {
  const trimmed = raw?.trim().toLowerCase()
  if (!trimmed) return null
  if (trimmed.includes('://')) {
    try {
      return new URL(trimmed).hostname.toLowerCase()
    } catch {
      return null
    }
  }
  return trimmed.replace(/\/.*$/, '')
}

function hasTraversalOrUnsafeChars(input: string): boolean {
  if (input.includes('..') || UNSAFE_MEDIA_CHARS_RE.test(input)) return true
  try {
    const decoded = decodeURIComponent(input)
    if (decoded.includes('..') || UNSAFE_MEDIA_CHARS_RE.test(decoded)) return true
  } catch {
    return true
  }
  return false
}

/**
 * Validates whether a string is a safe local `/uploads/<slug>/<file>` path
 * or an allowed media URL (HTTPS, local HTTP dev, Supabase public storage,
 * or configured media hosts).
 */
export function isAllowedMediaUrl(value: string): boolean {
  if (typeof value !== 'string') return false
  if (!value || value !== value.trim() || /\s/.test(value)) return false
  if (DANGEROUS_SCHEME_RE.test(value)) return false
  if (hasTraversalOrUnsafeChars(value)) return false

  if (value.startsWith('/')) {
    return SAFE_UPLOAD_PATH_RE.test(value) && !value.includes('..')
  }

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return false
  }

  if (parsed.username || parsed.password || !parsed.hostname) return false

  const protocol = parsed.protocol.toLowerCase()
  const hostname = parsed.hostname.toLowerCase()

  if (protocol !== 'https:' && !(protocol === 'http:' && LOCAL_HTTP_HOSTS.has(hostname))) {
    return false
  }

  if (hasTraversalOrUnsafeChars(parsed.pathname) || hasTraversalOrUnsafeChars(parsed.search)) {
    return false
  }

  const configuredHosts = [
    normalizeMediaHost(process.env.NEXT_PUBLIC_SUPABASE_MEDIA_HOST),
    normalizeMediaHost(process.env.NEXT_PUBLIC_MEDIA_HOST),
  ].filter((h): h is string => Boolean(h))

  if (configuredHosts.includes(hostname)) {
    return true
  }

  if (hostname === 'supabase.co' || SUPABASE_HOST_RE.test(hostname)) {
    return (
      protocol === 'https:' &&
      SUPABASE_HOST_RE.test(hostname) &&
      parsed.pathname.startsWith(SUPABASE_PUBLIC_STORAGE_PREFIX) &&
      parsed.pathname.length > SUPABASE_PUBLIC_STORAGE_PREFIX.length
    )
  }

  return true
}

const SAFE_HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
const SAFE_RGB_COLOR_RE =
  /^rgba?\(\s*[\d.+-]+%?(?:\s*,\s*[\d.+-]+%?){2}(?:\s*,\s*[\d.+-]+%?)?\s*\)$|^rgba?\(\s*[\d.+-]+%?(?:\s+[\d.+-]+%?){2}(?:\s*\/\s*[\d.+-]+%?)?\s*\)$/i
const SAFE_HSL_COLOR_RE =
  /^hsla?\(\s*[\d.+-]+(?:deg|rad|grad|turn)?(?:\s*,\s*[\d.+-]+%\s*,\s*[\d.+-]+%(?:\s*,\s*[\d.+-]+%?)?|\s+[\d.+-]+%\s+[\d.+-]+%(?:\s*\/\s*[\d.+-]+%?)?)\s*\)$/i
const SAFE_NAMED_COLOR_RE = /^[a-zA-Z]{3,30}$/
const UNSAFE_CSS_VALUE_RE = /[<>;"'`{}\\]|url\s*\(|<\/style/i

export function isSafeCssColor(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || UNSAFE_CSS_VALUE_RE.test(trimmed)) return false
  return (
    SAFE_HEX_COLOR_RE.test(trimmed) ||
    SAFE_RGB_COLOR_RE.test(trimmed) ||
    SAFE_HSL_COLOR_RE.test(trimmed) ||
    SAFE_NAMED_COLOR_RE.test(trimmed)
  )
}

export const cssColorSchema = z
  .string()
  .trim()
  .refine(isSafeCssColor, 'Color CSS inválido')

export const optionalCssColorSchema = z.union([cssColorSchema, z.literal('')]).optional()

export const mediaUrlSchema = z
  .string()
  .refine(isAllowedMediaUrl, 'URL o ruta de imagen inválida')

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
  backgroundColor: cssColorSchema,
  textColor: cssColorSchema,
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
  backgroundColor: optionalCssColorSchema,
  textColor: optionalCssColorSchema,
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
  backgroundColor: optionalCssColorSchema,
  textColor: optionalCssColorSchema,
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
    background: cssColorSchema,
    text: cssColorSchema,
    accent: cssColorSchema,
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
    secondaryBg: optionalCssColorSchema,
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
    background: '#faf7f2',
    text: '#1a1a1a',
    accent: '#c47a3a',
    fontPair: 'fraunces-nunito',
    spacing: 'normal',
    artworkTreatment: 'margin',
    secondaryBg: '#efe9e0',
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
