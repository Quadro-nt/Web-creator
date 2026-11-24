import { NextResponse } from 'next/server'
import {
  PKCE_COOKIE_PREFIX,
  buildSessionCookieOptions,
  createGoogleOAuthRedirect,
} from '@/lib/auth/session'

const VALID_TEMPLATES = new Set(['minimal-gallery', 'editorial', 'immersive'])
const PKCE_MAX_AGE_SECONDS = 600

export async function GET(request: Request) {
  const url = new URL(request.url)
  const rawTemplate = url.searchParams.get('template')
  const template = rawTemplate && VALID_TEMPLATES.has(rawTemplate) ? rawTemplate : undefined
  const redirectTo = `${url.origin}/api/auth/callback${template ? `?template=${encodeURIComponent(template)}` : ''}`

  const result = await createGoogleOAuthRedirect({ redirectTo })
  if (!result.ok) {
    return NextResponse.redirect(new URL('/login?error=oauth_unavailable', request.url))
  }

  const response = NextResponse.redirect(result.url)
  const cookieOptions = buildSessionCookieOptions(PKCE_MAX_AGE_SECONDS)
  for (const cookie of result.pkceCookies) {
    const cookieName = cookie.name.startsWith(PKCE_COOKIE_PREFIX)
      ? cookie.name
      : `${PKCE_COOKIE_PREFIX}${cookie.name}`
    response.cookies.set(cookieName, cookie.value, cookieOptions)
  }

  return response
}
