import { NextResponse } from 'next/server'
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  REFRESH_COOKIE,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  buildSessionCookieOptions,
  getSessionUserFromTokens,
  parseCookieHeader,
} from '@/lib/auth/session'

function sanitizeNextPath(rawNext: string | null): string {
  if (!rawNext) return '/studio'
  if (!rawNext.startsWith('/') || rawNext.startsWith('//') || rawNext.startsWith('/\\')) {
    return '/studio'
  }
  return rawNext
}

/** Refreshes an expired access token via refresh cookie and persists rotated cookies on redirect. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const safeNext = sanitizeNextPath(url.searchParams.get('next'))
  const parsedCookies = parseCookieHeader(request.headers.get('cookie'))

  const result = await getSessionUserFromTokens(
    {
      accessToken: parsedCookies[ACCESS_COOKIE],
      refreshToken: parsedCookies[REFRESH_COOKIE],
    },
    { allowRefresh: true }
  )

  if (!result?.user) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.set(ACCESS_COOKIE, '', buildSessionCookieOptions(0))
    response.cookies.set(REFRESH_COOKIE, '', buildSessionCookieOptions(0))
    return response
  }

  const response = NextResponse.redirect(new URL(safeNext, request.url))
  if (result.refreshedTokens) {
    response.cookies.set(
      ACCESS_COOKIE,
      result.refreshedTokens.accessToken,
      buildSessionCookieOptions(ACCESS_COOKIE_MAX_AGE_SECONDS)
    )
    if (result.refreshedTokens.refreshToken) {
      response.cookies.set(
        REFRESH_COOKIE,
        result.refreshedTokens.refreshToken,
        buildSessionCookieOptions(REFRESH_COOKIE_MAX_AGE_SECONDS)
      )
    }
  }

  return response
}
