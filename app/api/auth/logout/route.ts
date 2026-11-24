import { NextResponse } from 'next/server'
import { ACCESS_COOKIE, REFRESH_COOKIE, buildSessionCookieOptions } from '@/lib/auth/session'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  const expiredOptions = buildSessionCookieOptions(0)
  response.cookies.set(ACCESS_COOKIE, '', expiredOptions)
  response.cookies.set(REFRESH_COOKIE, '', expiredOptions)
  return response
}
