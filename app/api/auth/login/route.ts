import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  buildSessionCookieOptions,
  signInWithEmail,
} from '@/lib/auth/session'
import { getArtistByUserId } from '@/lib/onboarding/artist-onboarding'

const ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

const LoginBodySchema = z.object({
  email: z.string().trim().email('Ingresa un correo electrónico válido.'),
  password: z.string().min(1, 'Ingresa tu contraseña.'),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON inválido.' }, { status: 400 })
  }

  const parsed = LoginBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos de acceso inválidos.' },
      { status: 400 }
    )
  }

  const result = await signInWithEmail(parsed.data)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 })
  }

  const artist = await getArtistByUserId(result.user.id)
  const response = NextResponse.json({
    ok: true,
    redirectTo: artist ? '/studio' : '/onboarding',
  })

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

  return response
}
