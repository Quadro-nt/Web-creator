const INTERNAL_RE = /^\/(?:[a-z0-9-_]+(?:\/[a-z0-9-_]+)*)?$/i
const EXTERNAL_RE = /^(?:https?|mailto|tel):/

/** Resolves an editor-level href into a runtime URL for the given artist slug. */
export function resolveSiteHref(href: string, artistSlug: string): string {
  if (!href) return href
  if (EXTERNAL_RE.test(href) || href.startsWith('#')) return href
  if (href.startsWith('/sites/')) return href
  if (INTERNAL_RE.test(href)) {
    if (href === '/') return `/sites/${artistSlug}`
    return `/sites/${artistSlug}${href}`
  }
  return href
}

/** True when the href is an external scheme (http/https/mailto/tel). */
export function isExternalHref(href: string): boolean {
  return /^https?:/.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')
}
