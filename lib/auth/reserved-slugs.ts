/** Slugs reserved for platform routes, subdomains, and infrastructure. */
export const RESERVED_ARTIST_SLUGS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'login',
  'signup',
  'register',
  'onboarding',
  'studio',
  'dashboard',
  'editor',
  'sites',
  'auth',
  'logout',
  'settings',
  'billing',
  'support',
  'help',
  'quadro',
  'static',
  'assets',
  'cdn',
  'mail',
  'blog',
])

const VALID_ARTIST_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Returns true when a slug (case-insensitive) belongs to the reserved list. */
export function isReservedArtistSlug(slug: string): boolean {
  return RESERVED_ARTIST_SLUGS.has(slug.trim().toLowerCase())
}

/** Converts an arbitrary display string into a URL-safe artist slug (max 40 chars). */
export function normalizeArtistSlug(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
}

/** Validates a candidate artist slug for length (3..40), format, and reservation. */
export function validateNewArtistSlug(
  raw: string
): { ok: true; slug: string } | { ok: false; error: string } {
  const slug = raw.trim().toLowerCase()

  if (slug.length < 3 || slug.length > 40) {
    return {
      ok: false,
      error: 'El subdominio debe tener entre 3 y 40 caracteres.',
    }
  }

  if (!VALID_ARTIST_SLUG_RE.test(slug)) {
    return {
      ok: false,
      error:
        'El subdominio solo puede usar letras minúsculas sin acentos, números y guiones medios.',
    }
  }

  if (isReservedArtistSlug(slug)) {
    return {
      ok: false,
      error: 'Este subdominio está reservado por la plataforma.',
    }
  }

  return { ok: true, slug }
}
