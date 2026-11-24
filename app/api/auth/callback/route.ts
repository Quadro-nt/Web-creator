import { NextResponse } from 'next/server'
import {
  ACCESS_COOKIE,
  PKCE_COOKIE_PREFIX,
  REFRESH_COOKIE,
  buildSessionCookieOptions,
  exchangeOAuthCode,
  parseCookieHeader,
} from '@/lib/auth/session'
import { getArtistByUserId } from '@/lib/onboarding/artist-onboarding'

const VALID_TEMPLATES = new Set(['minimal-gallery', 'editorial', 'immersive'])
const ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

function clearPkceCookies(response: NextResponse, cookieNames: string[]) {
  const expiredOptions = buildSessionCookieOptions(0)
  for (const name of cookieNames) {
    if (name.startsWith(PKCE_COOKIE_PREFIX)) {
      response.cookies.set(name, '', expiredOptions)
    }
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', request.url))
  }

  const rawTemplate = url.searchParams.get('template')
  const template = rawTemplate && VALID_TEMPLATES.has(rawTemplate) ? rawTemplate : undefined

  const parsedCookies = parseCookieHeader(request.headers.get('cookie'))
  const pkceCookies = Object.entries(parsedCookies).map(([name, value]) => ({ name, value }))

  const result = await exchangeOAuthCode({ code, pkceCookies })
  if (!result.ok) {
    const errorResponse = NextResponse.redirect(new URL('/login?error=oauth_failed', request.url))
    clearPkceCookies(errorResponse, Object.keys(parsedCookies))
    return errorResponse
  }

  const artist = await getArtistByUserId(result.user.id)
  const dest = artist
    ? '/studio'
    : template
      ? `/onboarding?template=${encodeURIComponent(template)}`
      : '/onboarding'

  const response = NextResponse.redirect(new URL(dest, request.url))
  response.cookies.set(
    ACCESS_COOKIE,
    result.tokens.accessToken,
    buildSessionCookieOptions(ACCESS_MAX_AGE_SECONDS)
  )
  if (result.tokens.refreshToken) {
    response.cookies.set(
      REFRESH_COOKIE,
      result.tokens.refreshToken,
      buildSessionCookieOptions(REFRESH_MAX_AGE_SECONDS)
    )
  }
  clearPkceCookies(response, Object.keys(parsedCookies))

  return response
}
