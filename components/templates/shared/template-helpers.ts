import type { SectionConfig, SiteConfig } from '@/lib/schemas/site-config.schema'
import { SECTION_TYPE_LABELS } from '@/app/editor/[token]/EditorConfig'

export type NavItem = {
  id: string
  label: string
  index: number
}

export function getNavItems(config: SiteConfig): NavItem[] {
  return config.sections
    .filter(
      (s) =>
        s.visible &&
        s.type !== 'cover' &&
        s.type !== 'divider' &&
        s.type !== 'marquee' &&
        s.type !== 'social-strip'
    )
    .map((s, idx) => {
      const customLabel = typeof s.content.navLabel === 'string' ? s.content.navLabel.trim() : ''
      const fallback = SECTION_TYPE_LABELS[s.type] ?? s.type
      return {
        id: s.id,
        label: customLabel || fallback,
        index: idx + 1,
      }
    })
}

export function sanitizeExternalUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/uploads/') && !trimmed.includes('..')) return trimmed
  return null
}

export function sanitizeHref(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (
    trimmed.startsWith('#') ||
    (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) ||
    /^https?:\/\//i.test(trimmed) ||
    /^mailto:/i.test(trimmed)
  ) {
    return trimmed
  }
  return null
}

export function sanitizeSocialHandle(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const handle = raw.trim().replace(/^@+/, '').trim()
  if (!/^[a-zA-Z0-9._-]{1,60}$/.test(handle)) return null
  if (handle === '.' || handle === '..') return null
  return handle
}

export function buildWhatsappUrl(rawNumber: unknown, message: string): string | null {
  const fromContent = typeof rawNumber === 'string' ? rawNumber.replace(/[^\d]/g, '') : ''
  const fromEnv = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '').replace(/[^\d]/g, '')
  const digits = fromContent || fromEnv
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function parseVideoEmbedUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase()

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0] ?? ''
      if (/^[a-zA-Z0-9_-]{6,20}$/.test(id)) {
        return `https://www.youtube.com/embed/${id}`
      }
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const v = parsed.searchParams.get('v') ?? ''
      if (/^[a-zA-Z0-9_-]{6,20}$/.test(v)) {
        return `https://www.youtube.com/embed/${v}`
      }
      const parts = parsed.pathname.split('/').filter(Boolean)
      if ((parts[0] === 'embed' || parts[0] === 'shorts') && parts[1] && /^[a-zA-Z0-9_-]{6,20}$/.test(parts[1])) {
        return `https://www.youtube.com/embed/${parts[1]}`
      }
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const parts = parsed.pathname.split('/').filter(Boolean)
      const id = parts[parts.length - 1] ?? ''
      if (/^\d{5,15}$/.test(id)) {
        return `https://player.vimeo.com/video/${id}`
      }
    }
  } catch {
    return null
  }

  return null
}

export function isExtraSectionType(type: SectionConfig['type']): boolean {
  return (
    type === 'featured-work' ||
    type === 'statement' ||
    type === 'gallery' ||
    type === 'press' ||
    type === 'video' ||
    type === 'cta' ||
    type === 'divider' ||
    type === 'marquee' ||
    type === 'category-grid' ||
    type === 'feature-split' ||
    type === 'social-strip' ||
    type === 'reviews' ||
    type === 'newsletter'
  )
}
