import { getArtistByUserId } from '../onboarding/artist-onboarding'
import {
  ACCESS_COOKIE,
  SESSION_SENTINEL_TOKEN,
  getSessionUserFromRequest,
  parseCookieHeader,
} from './session'
import { validateEditorToken } from './token-validator'

const SAFE_SLUG_RE = /^[a-z0-9-]+$/

export function isSafeArtistSlug(slug: string): boolean {
  return SAFE_SLUG_RE.test(slug)
}

export type VerifyEditorResult =
  | { ok: true; artistSlug: string }
  | { ok: false; status: 401 | 403; error: string }

function extractToken(request: Request): string {
  const headerToken = request.headers.get('x-editor-token')
  if (headerToken && headerToken.trim().length > 0) {
    return headerToken.trim()
  }
  const auth = request.headers.get('authorization') ?? ''
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim()
  }
  return ''
}

export async function verifyEditorRequest(
  request: Request,
  expectedSlug?: string,
  validateFn: (token: string) => Promise<string | null> = validateEditorToken,
  baseDir?: string
): Promise<VerifyEditorResult> {
  const token = extractToken(request)
  const cookies = parseCookieHeader(request.headers.get('cookie'))
  const hasSessionCookie = Boolean(cookies[ACCESS_COOKIE])

  if (token === SESSION_SENTINEL_TOKEN || (!token && hasSessionCookie)) {
    const user = await getSessionUserFromRequest(request, baseDir)
    if (!user) {
      return { ok: false, status: 401, error: 'Sesión inválida o expirada' }
    }

    const artist = await getArtistByUserId(user.id, baseDir)
    if (!artist) {
      return { ok: false, status: 403, error: 'Aún no has creado tu sitio de artista' }
    }

    if (expectedSlug !== undefined) {
      if (!isSafeArtistSlug(expectedSlug) || artist.slug !== expectedSlug) {
        return { ok: false, status: 403, error: 'No autorizado para este artista' }
      }
    }

    return { ok: true, artistSlug: artist.slug }
  }

  if (!token) {
    return { ok: false, status: 401, error: 'Token de editor faltante' }
  }

  const validatedSlug = await validateFn(token)
  if (!validatedSlug) {
    return { ok: false, status: 401, error: 'Token de editor inválido' }
  }

  if (expectedSlug !== undefined) {
    if (!isSafeArtistSlug(expectedSlug) || validatedSlug !== expectedSlug) {
      return { ok: false, status: 403, error: 'No autorizado para este artista' }
    }
  }

  return { ok: true, artistSlug: validatedSlug }
}
